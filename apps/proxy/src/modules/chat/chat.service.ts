import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BudgetService } from '../budget/budget.service';
import { ChatRequest, ChatResponse, StreamChunk, ProviderName } from '@aura/shared';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly providers: ProvidersService,
    private readonly budget: BudgetService,
  ) {}

  async chat(request: ChatRequest, project: any): Promise<ChatResponse> {
    const provider = this.resolveProvider(request);

    try {
      const response = await provider.chat(request);
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

  async *stream(request: ChatRequest, project: any): AsyncIterable<StreamChunk> {
    const provider = this.resolveProvider(request);

    try {
      for await (const chunk of provider.stream(request)) {
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
    } catch (err: any) {
      this.logger.error(`Streaming error: ${err.message}`);
      yield {
        id: 'error',
        content: `Stream error: ${err.message}`,
        done: true,
      };
    }
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
}
