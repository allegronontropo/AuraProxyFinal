import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BudgetService } from '../budget/budget.service';
import { CacheService } from '../cache/cache.service';
import { ChatRequest, ChatResponse, ProjectContext } from '@aura/shared';
import { PrismaService } from '../../prisma/prisma.service';

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
    const providerName = this.getProviderName(request);
    const prompt = this.formatPrompt(request.messages);
    const parametersHash = this.cache.hashParameters({
      temperature: request.temperature ?? null,
      maxTokens: request.maxTokens ?? null,
      topP: request.topP ?? null,
    });

    const cacheInput = {
      projectId: project.id,
      provider: providerName,
      model: request.model,
      prompt,
      parametersHash,
    };

    const cachedResponse = await this.cache.find(cacheInput).catch((err) => {
      this.logger.warn(`Cache lookup skipped: ${err.message}`);
      return null;
    });

    if (cachedResponse) {
      this.logger.log(`Cache hit for model ${request.model}`);
      
      const response = {
        ...cachedResponse,
        cached: true,
      };

      // Asynchronously log the cache hit and increment the hit counter
      this.logCacheHit(request, project, response, Math.round(performance.now() - start)).catch(err => 
        this.logger.error(`Failed to log cache hit: ${err.message}`)
      );
      this.budget.recordCacheEvent(project.id, true).catch(err =>
        this.logger.error(`Failed to record cache hit counter: ${err.message}`)
      );

      return response;
    }

    // Cache miss — increment miss counter before routing to provider
    this.budget.recordCacheEvent(project.id, false).catch(err =>
      this.logger.error(`Failed to record cache miss counter: ${err.message}`)
    );

    const provider = this.resolveProvider(request);

    try {
      const response = await provider.chat(request);
      
      this.cache
        .set(cacheInput, response)
        .catch((err) => this.logger.error(`Failed to cache response: ${err.message}`));

      const cost = provider.estimateCost(response.usage);

      if (cost > 0) {
        this.budget
          .recordSpend(project.id, cost, project.budgetPeriod)
          .catch((err) => this.logger.error(`Failed to record spend: ${err.message}`));
      }

      return response;
    } catch (err: any) {
      this.logger.error(`Chat request failed: ${err.message}`);
      throw new HttpException(
        `Provider "${provider.name}" error: ${this.simplifyErrorMessage(err.message)}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private simplifyErrorMessage(errorMessage: string): string {
    if (!errorMessage) return 'Unknown error occurred.';
    const lowerMsg = errorMessage.toLowerCase();
    
    if (lowerMsg.includes('429') || lowerMsg.includes('quota') || lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests')) {
      return 'Rate limit exceeded or quota exhausted. Please try again later.';
    }
    
    if (lowerMsg.includes('401') || lowerMsg.includes('unauthorized') || lowerMsg.includes('invalid api key') || lowerMsg.includes('authentication')) {
      return 'Invalid API key or authentication failed.';
    }
    
    if (lowerMsg.includes('404') || lowerMsg.includes('not found') || lowerMsg.includes('modelname is not defined')) {
      return 'The requested model was not found or is not supported.';
    }

    if (lowerMsg.includes('400') || lowerMsg.includes('bad request')) {
      return 'Invalid request configuration or parameters sent to provider.';
    }

    // Fallback: return a truncated version to prevent massive sidebars
    return errorMessage.length > 120 ? errorMessage.substring(0, 120) + '...' : errorMessage;
  }

  private getProviderName(request: ChatRequest): string {
    if (request.provider) return request.provider;
    
    const model = request.model.toLowerCase();
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('mistral-') || model.startsWith('codestral')) return 'mistral';
    if (model.startsWith('gemini-')) return 'google';
    
    return 'openai'; // Default fallback
  }

  private resolveProvider(request: ChatRequest) {
    try {
      if (request.provider && this.providers.has(request.provider)) {
        return this.providers.get(request.provider);
      }
      return this.providers.resolveFromModel(request.model);
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  private formatPrompt(messages: any[]): string {
    return messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
      .trim();
  }

  private async logCacheHit(request: ChatRequest, project: ProjectContext, response: any, latencyMs: number): Promise<void> {
    if (!request.apiKeyId) return;

    await this.prisma.requestLog.create({
      data: {
        apiKeyId: request.apiKeyId,
        projectId: project.id,
        provider: response.provider ?? request.provider ?? 'unknown',
        model: response.model ?? request.model ?? 'unknown',
        tokensIn: response.usage?.promptTokens ?? 0,
        tokensOut: response.usage?.completionTokens ?? 0,
        costUsd: 0,
        latencyMs,
        statusCode: 200,
        cached: true,
      }
    });
  }
}
