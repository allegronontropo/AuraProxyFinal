import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BudgetService } from '../budget/budget.service';
import { CacheService } from '../cache/cache.service';
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
    const cachedResponse = await this.cache.find(cacheInput).catch((err) => {
      this.logger.warn(`Cache lookup skipped: ${err.message}`);
      return null;
    });
    const cacheLatencyMs = Math.round(performance.now() - cacheStart);

    if (cachedResponse) {
      this.logger.log(`Cache hit for model ${request.model}`);

      const response = { ...cachedResponse, cached: true };

      this.logCacheHit(request, project, response, cacheLatencyMs, Math.round(performance.now() - start)).catch(err =>
        this.logger.error(`Failed to log cache hit: ${err.message}`)
      );
      this.budget.recordCacheEvent(project.id, true).catch(err =>
        this.logger.error(`Failed to record cache hit counter: ${err.message}`)
      );

      return response;
    }

    // Cache miss — track it
    this.budget.recordCacheEvent(project.id, false).catch(err =>
      this.logger.error(`Failed to record cache miss counter: ${err.message}`)
    );

    // Route through fallback chain
    return this.tryWithFallback(request, project, primaryProvider, cacheInput, cacheLatencyMs);
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
    } else {
      // Use default provider chains if no explicit fallback models are set
      const defaultProviders = DEFAULT_FALLBACK_CHAINS[primaryProvider] ?? [];
      for (const p of defaultProviders) {
        if (p !== primaryProvider) {
          chain.push({ providerName: p, modelName: request.model }); 
        }
      }
    }

    let lastError: Error | null = null;
    let primaryError: Error | null = null;
    let fallbackErrors: string[] = [];

    for (const { providerName, modelName } of chain) {
      let provider: LLMProvider;

      try {
        provider = await this.providers.getProviderForProject(providerName, project.id);
      } catch (err: any) {
        // No key configured for this fallback provider — skip it silently
        this.logger.warn(`Skipping fallback to "${providerName}": ${err.message}`);
        if (providerName === primaryProvider) {
          primaryError = err;
        } else {
          fallbackErrors.push(`[${providerName}] ${this.simplifyErrorMessage(err.message)}`);
        }
        lastError = err;
        continue;
      }

      try {
        const isFallback = providerName !== primaryProvider || modelName !== request.model;
        if (isFallback) {
          this.logger.warn(`Falling back to "${providerName}:${modelName}" after previous model failed`);
        }

        const currentRequest = { ...request, model: modelName, provider: providerName as any, cacheLatencyMs };
        const response = await provider.chat(currentRequest);

        // Cache the successful response
        this.cache
          .set(cacheInput, response)
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
            },
          } as ChatResponse;
        }

        return response;
      } catch (err: any) {
        if (providerName === primaryProvider) {
          primaryError = err;
        } else {
          fallbackErrors.push(`[${providerName}] ${this.simplifyErrorMessage(err.message)}`);
        }
        lastError = err;
        this.logger.warn(
          `Provider "${providerName}" failed: ${this.simplifyErrorMessage(err.message)}`
        );

        // Auth errors: abort the chain — other providers won't fix a wrong key
        if (isNonRetryableError(err.message)) {
          this.logger.warn(`Auth error on "${providerName}" — aborting fallback chain`);
          break;
        }
        // Otherwise continue to the next provider in the chain
      }
    }

    // All providers exhausted
    const errorToReport = primaryError || lastError;
    let finalMessage = errorToReport
      ? this.simplifyErrorMessage(errorToReport.message)
      : 'All providers in the fallback chain failed.';

    if (fallbackErrors.length > 0) {
      finalMessage += ` (Fallbacks also failed: ${fallbackErrors.join(', ')})`;
    }

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
      },
    });
  }
}
