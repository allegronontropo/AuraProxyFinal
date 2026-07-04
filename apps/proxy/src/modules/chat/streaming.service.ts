import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BudgetService } from '../budget/budget.service';
import { ChatRequest, ProjectContext, StreamChunk, DEFAULT_FALLBACK_CHAINS, isNonRetryableError } from '@aura/shared';

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);

  constructor(
    @Inject(ProvidersService) private readonly providers: ProvidersService,
    @Inject(BudgetService) private readonly budget: BudgetService,
  ) {}

  async *stream(request: ChatRequest, project: ProjectContext): AsyncIterable<StreamChunk> {
    const primaryProvider = this.getProviderName(request);
    
    // Build the execution chain
    let chain: Array<{ providerName: string; modelName: string }> = [];
    chain.push({ providerName: primaryProvider, modelName: request.model });
    
    if (project.fallbackModels && project.fallbackModels.length > 0) {
      for (const fallbackModel of project.fallbackModels) {
        try {
          const fallbackProvider = this.getProviderName({ model: fallbackModel } as ChatRequest);
          chain.push({ providerName: fallbackProvider, modelName: fallbackModel });
        } catch (e) {}
      }
    } else {
      const defaultProviders = DEFAULT_FALLBACK_CHAINS[primaryProvider] ?? [];
      for (const p of defaultProviders) {
        if (p !== primaryProvider) {
          chain.push({ providerName: p, modelName: request.model }); 
        }
      }
    }

    let lastError: Error | null = null;
    let primaryError: Error | null = null;

    for (const { providerName, modelName } of chain) {
      try {
        const provider = await this.providers.getProviderForProject(providerName, project.id);
        const currentRequest = { ...request, model: modelName, provider: providerName as any };
        
        let yielded = false;
        for await (const chunk of provider.stream(currentRequest)) {
          yielded = true;
          yield chunk;

          if (chunk.done && chunk.usage) {
            const cost = provider.estimateCost(chunk.usage);
            if (cost > 0) {
              this.budget
                .recordSpend(project.id, cost, project.budgetPeriod)
                .catch((err) => this.logger.error(`Failed to record streaming spend: ${err.message}`));
            }
          }
        }
        
        // If we yielded chunks successfully, we are done
        if (yielded) {
          return;
        }
      } catch (err: any) {
        if (providerName === primaryProvider) primaryError = err;
        lastError = err;
        this.logger.warn(`Streaming fallback: Provider "${providerName}:${modelName}" failed: ${err.message}`);
        
        if (isNonRetryableError(err.message)) {
          break;
        }
      }
    }

    // If we reach here, all providers failed
    const errorToReport = primaryError || lastError;
    this.logger.error(`All providers in fallback chain failed for streaming. Last error: ${errorToReport?.message}`);
    yield {
      id: 'error',
      content: `Stream error: ${errorToReport?.message || 'All providers failed'}`,
      done: true,
    };
  }

  private getProviderName(request: ChatRequest): string {
    if (request.provider) return request.provider;
    const model = request.model.toLowerCase();
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('mistral-') || model.startsWith('codestral')) return 'mistral';
    if (model.startsWith('gemini-')) return 'google';
    if (model.startsWith('llama3-') || model.startsWith('mixtral-') || model.startsWith('gemma-')) return 'groq';
    return 'openai';
  }
}
