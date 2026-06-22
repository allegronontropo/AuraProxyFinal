import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BudgetService } from '../budget/budget.service';
import { CacheService } from '../cache/cache.service';
import { ChatRequest, ChatResponse, ProjectContext } from '@aura/shared';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(ProvidersService) private readonly providers: ProvidersService,
    @Inject(BudgetService) private readonly budget: BudgetService,
    @Inject(CacheService) private readonly cache: CacheService,
  ) {}

  async chat(request: ChatRequest, project: ProjectContext): Promise<ChatResponse> {
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
      return {
        ...cachedResponse,
        cached: true,
      };
    }

    // Ne résoudre l'implémentation complète du fournisseur qu'en cas de non-correspondance du cache (cache miss)
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
        `Provider "${provider.name}" error: ${err.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private getProviderName(request: ChatRequest): string {
    if (request.provider) return request.provider;
    
    const model = request.model.toLowerCase();
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('mistral-') || model.startsWith('codestral')) return 'mistral';
    if (model.startsWith('gemini-')) return 'google';
    
    return 'openai'; // Solution de repli par défaut
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
}
