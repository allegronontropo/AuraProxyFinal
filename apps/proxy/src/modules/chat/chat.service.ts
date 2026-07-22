import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BudgetService } from '../budget/budget.service';
import { CacheService } from '../cache/cache.service';
import { AlertsService } from '../alerts/alerts.service';
import {
  ChatRequest,
  ChatResponse,
  ProjectContext,
  DEFAULT_FALLBACK_CHAINS,
  isNonRetryableError,
} from '@aura/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { LLMProvider } from '@aura/shared';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(ProvidersService) private readonly providers: ProvidersService,
    @Inject(BudgetService) private readonly budget: BudgetService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AlertsService) private readonly alerts: AlertsService,
  ) {}

  async chat(request: ChatRequest, project: ProjectContext): Promise<ChatResponse> {
    const start = performance.now();
    const primaryProvider = this.getProviderName(request);
    const prompt = this.formatPrompt(request.messages);
    const parametersHash = this.cache.hashParameters({
      temperature: request.temperature ?? null,
      maxTokens: request.maxTokens ?? null,
      topP: request.topP ?? null,
    });

    const cacheInput = {
      projectId: project.id,
      provider: primaryProvider,
      model: request.model,
      prompt,
      parametersHash,
    };

    const cacheStart = performance.now();
    const cacheLookup = await this.cache.find(cacheInput).catch((err) => {
      this.logger.warn(`Cache lookup skipped: ${err.message}`);
      return { hit: false, kind: 'miss' as const, response: null } as ReturnType<CacheService['find']> extends Promise<infer T> ? T : never;
    });
    const cacheLatencyMs = Math.round(performance.now() - cacheStart);

    if (cacheLookup.hit && cacheLookup.response) {
      this.logger.log(`Cache hit for model ${request.model}`);

      const response = { ...cacheLookup.response, cached: true };

      // latencyMs = auth time + chat() processing time, giving the true proxy-side latency
      const totalProxyLatencyMs = (request.authLatencyMs ?? 0) + Math.round(performance.now() - start);
      this.logCacheHit(request, project, response, cacheLatencyMs, totalProxyLatencyMs, cacheLookup.kind, cacheLookup.similarityScore).catch(err =>
        this.logger.error(`Failed to log cache hit: ${err.message}`)
      );
      this.budget.recordCacheEvent(project.id, true).catch(err =>
        this.logger.error(`Failed to record cache hit counter: ${err.message}`)
      );

      return response;
    }

    // Cache miss - track it
    this.budget.recordCacheEvent(project.id, false).catch(err =>
      this.logger.error(`Failed to record cache miss counter: ${err.message}`)
    );

    // Route through fallback chain
    return this.tryWithFallback(request, project, primaryProvider, cacheInput, cacheLatencyMs, cacheLookup.queryVector);
  }

  /**
   * Tries each provider in the fallback chain until one succeeds.
   * Skips remaining providers on auth errors (bad key won't self-fix).
   */
  private async tryWithFallback(
    request: ChatRequest,
    project: ProjectContext,
    primaryProvider: string,
    cacheInput: Parameters<CacheService['set']>[0],
    cacheLatencyMs: number,
    queryVector?: number[],
  ): Promise<ChatResponse> {
    
    // Build the execution chain
    let chain: Array<{ providerName: string; modelName: string }> = [];
    
    // Add primary
    chain.push({ providerName: primaryProvider, modelName: request.model });
    
    // Add fallbacks
    if (project.fallbackModels && project.fallbackModels.length > 0) {
      for (const fallbackModel of project.fallbackModels) {
        try {
          const fallbackProvider = this.getProviderName({ model: fallbackModel } as ChatRequest);
          chain.push({ providerName: fallbackProvider, modelName: fallbackModel });
        } catch (e) {
          // Ignore invalid fallback models
        }
      }
    }

    let lastError: Error | null = null;
    let primaryError: Error | null = null;
    let fallbackErrors: string[] = [];
    let isPrimaryAttempt = true;

    for (const { providerName, modelName } of chain) {
      let provider: LLMProvider;

      try {
        provider = await this.providers.getProviderForProject(providerName, project.id);
      } catch (err: any) {
        // No key configured for this provider
        this.logger.warn(`Skipping provider "${providerName}": ${err.message}`);
        
        this.alerts.createAlert({
          projectId: project.id,
          severity: 'warning',
          title: `API Key Not Configured: ${providerName}`,
          source: 'ChatService',
          description: `Attempted to route to ${providerName} but no API key is configured.`,
        }).catch(e => this.logger.error(`Failed to create missing key alert: ${e.message}`));

        if (isPrimaryAttempt) {
          primaryError = err;
        } else {
          fallbackErrors.push(`[${providerName}:${modelName}] ${this.simplifyErrorMessage(err.message)}`);
        }
        lastError = err;
        isPrimaryAttempt = false;
        continue;
      }

      try {
        const isFallback = !isPrimaryAttempt;
        if (isFallback) {
          this.logger.warn(`Falling back to "${providerName}:${modelName}" after previous model failed`);
          this.alerts.createAlert({
            projectId: project.id,
            severity: 'critical',
            title: `Fallback Triggered: ${providerName}`,
            source: 'ChatService',
            description: `Primary provider ${primaryProvider} failed. Routed request to ${providerName}.`,
            metadata: { primaryError: primaryError ? primaryError.message : null }
          }).catch(err => this.logger.error(`Failed to create warning alert: ${err.message}`));
        }

        const currentRequest = { 
          ...request, 
          model: modelName, 
          provider: providerName as any, 
          cacheLatencyMs,
          metadata: isFallback ? { 
            fallback_provider: providerName, 
            primary_provider: primaryProvider,
            primary_error: primaryError ? primaryError.message : null,
            fallback_errors: fallbackErrors.length > 0 ? fallbackErrors : null
          } : undefined
        };
        const response = await provider.chat(currentRequest);

        // Cache the successful response
        this.cache
          .set(cacheInput, response, queryVector)
          .catch((err) => this.logger.error(`Failed to cache response: ${err.message}`));

        // Record cost
        const cost = provider.estimateCost(response.usage);
        if (cost > 0) {
          this.budget
            .recordSpend(project.id, cost, project.budgetPeriod)
            .catch((err) => this.logger.error(`Failed to record spend: ${err.message}`));
        }

        // Attach fallback metadata so the logs table can show a FALLBACK badge
        if (isFallback) {
          return {
            ...response,
            metadata: {
              ...(response as any).metadata,
              fallback_provider: providerName,
              primary_provider: primaryProvider,
              primary_error: primaryError ? primaryError.message : null,
              fallback_errors: fallbackErrors.length > 0 ? fallbackErrors : null
            },
          } as ChatResponse;
        }

        return response;
      } catch (err: any) {
        if (isPrimaryAttempt) {
          primaryError = err;
        } else {
          fallbackErrors.push(`[${providerName}:${modelName}] ${this.simplifyErrorMessage(err.message)}`);
        }
        lastError = err;
        this.logger.warn(
          `Provider "${providerName}" failed: ${this.simplifyErrorMessage(err.message)}`
        );

        const lowerMsg = err.message.toLowerCase();
        if (
          lowerMsg.includes('429') ||
          lowerMsg.includes('rate limit') ||
          lowerMsg.includes('quota') ||
          lowerMsg.includes('too many requests')
        ) {
          this.alerts.createAlert({
            projectId: project.id,
            severity: 'warning',
            title: `Rate Limit Exceeded: ${providerName}`,
            source: 'ChatService',
            description: `The provider ${providerName} rejected the request due to rate limits or exhausted quota.`,
            metadata: { error: err.message }
          }).catch(e => this.logger.error(e.message));
        }

        // Auth errors: abort the chain - other providers won't fix a wrong key
        if (isNonRetryableError(err.message)) {
          this.alerts.createAlert({
            projectId: project.id,
            severity: 'critical',
            title: `Invalid API Key: ${providerName}`,
            source: 'ChatService',
            description: `The configured API key for ${providerName} is invalid or unauthorized.`,
            metadata: { error: err.message }
          }).catch(e => this.logger.error(e.message));

          this.logger.warn(`Auth error on "${providerName}" - aborting fallback chain`);
          break;
        }
        // Otherwise continue to the next provider in the chain
      }

      // Ensure next iteration is treated as a fallback
      isPrimaryAttempt = false;
    }

    // All providers exhausted
    const errorToReport = primaryError || lastError;
    let finalMessage = errorToReport
      ? this.simplifyErrorMessage(errorToReport.message)
      : 'All providers in the fallback chain failed.';

    if (fallbackErrors.length > 0) {
      finalMessage += ` (Fallbacks also failed: ${fallbackErrors.join(', ')})`;
    }

    // Since we now generate specific alerts for rate limits/missing keys above,
    // this final alert truly means the entire routing system failed to find a working provider.
    await this.alerts.createAlert({
      projectId: project.id,
      severity: 'critical',
      title: 'System Down: All Routing Providers Exhausted',
      source: 'ChatService',
      description: finalMessage,
      metadata: {
        primaryError: primaryError ? primaryError.message : null,
        fallbackErrors,
      }
    });

    throw new HttpException(`Gateway error: ${finalMessage}`, HttpStatus.BAD_GATEWAY);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private simplifyErrorMessage(errorMessage: string): string {
    if (!errorMessage) return 'Unknown error occurred.';
    const lowerMsg = errorMessage.toLowerCase();

    if (
      lowerMsg.includes('429') ||
      lowerMsg.includes('quota') ||
      lowerMsg.includes('rate limit') ||
      lowerMsg.includes('too many requests')
    ) {
      return 'Rate limit exceeded or quota exhausted. Please try again later.';
    }
    if (
      lowerMsg.includes('401') ||
      lowerMsg.includes('unauthorized') ||
      lowerMsg.includes('invalid api key') ||
      lowerMsg.includes('authentication')
    ) {
      return 'Invalid API key or authentication failed.';
    }
    if (
      lowerMsg.includes('404') ||
      lowerMsg.includes('not found') ||
      lowerMsg.includes('modelname is not defined')
    ) {
      return 'The requested model was not found or is not supported.';
    }
    if (lowerMsg.includes('400') || lowerMsg.includes('bad request')) {
      return 'Invalid request configuration or parameters sent to provider.';
    }

    return errorMessage.length > 120 ? errorMessage.substring(0, 120) + '...' : errorMessage;
  }

  private getProviderName(request: ChatRequest): string {
    if (request.provider) return request.provider;

    const model = request.model.toLowerCase();
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('mistral-') || model.startsWith('codestral')) return 'mistral';
    if (model.startsWith('gemini-')) return 'google';
    if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('gemma')) return 'groq';

    return 'openai'; // Default fallback
  }

  private formatPrompt(messages: any[]): string {
    return messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
      .trim();
  }

  private async logCacheHit(
    request: ChatRequest,
    project: ProjectContext,
    response: any,
    cacheLatencyMs: number,
    latencyMs: number,
    cacheHitKind: 'exact' | 'semantic' | 'miss',
    similarityScore?: number,
  ): Promise<void> {
    if (!request.apiKeyId) return;

    await this.prisma.client.requestLog.create({
      data: {
        apiKeyId: request.apiKeyId,
        projectId: project.id,
        provider: response.provider ?? request.provider ?? 'unknown',
        model: response.model ?? request.model ?? 'unknown',
        tokensIn: response.usage?.promptTokens ?? 0,
        tokensOut: response.usage?.completionTokens ?? 0,
        costUsd: 0,
        authLatencyMs: request.authLatencyMs ?? 0,
        cacheLatencyMs,
        llmLatencyMs: 0,
        latencyMs,
        statusCode: 200,
        cached: true,
        metadata: {
          cache_hit_type: cacheHitKind,
          ...(cacheHitKind === 'semantic' && similarityScore != null ? { cache_similarity_score: similarityScore } : {}),
        },
      },
    });
  }
}
