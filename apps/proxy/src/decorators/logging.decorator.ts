/**
 * Logging Decorator — Decorator Pattern
 *
 * Wraps any LLMProvider to add structured logging for every request.
 * Logs: request start, provider name, model, latency, token count.
 * Uses pino-compatible logger (Fastify's built-in logger).
 */

import type {
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from '@aura/shared';
import { BaseDecorator } from './base.decorator.js';

export interface Logger {
  info(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
}

export class LoggingDecorator extends BaseDecorator {
  private logger: Logger;

  constructor(provider: import('@aura/shared').LLMProvider, logger: Logger) {
    super(provider);
    this.logger = logger;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = performance.now();

    this.logger.info(
      { provider: this.name, model: request.model },
      `[${this.name}] Chat request started`
    );

    try {
      const response = await this.wrapped.chat(request);
      const totalLatency = Math.round(performance.now() - start);

      this.logger.info(
        {
          provider: this.name,
          model: response.model,
          latencyMs: totalLatency,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          cost: `$${this.estimateCost(response.usage).toFixed(6)}`,
        },
        `[${this.name}] Chat request completed`
      );

      return response;
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      this.logger.error(
        {
          provider: this.name,
          model: request.model,
          latencyMs,
          error: err instanceof Error ? err.message : String(err),
        },
        `[${this.name}] Chat request failed`
      );
      throw err;
    }
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const start = performance.now();

    this.logger.info(
      { provider: this.name, model: request.model },
      `[${this.name}] Stream request started`
    );

    let chunkCount = 0;
    try {
      for await (const chunk of this.wrapped.stream(request)) {
        chunkCount++;
        yield chunk;

        if (chunk.done) {
          const latencyMs = Math.round(performance.now() - start);
          this.logger.info(
            {
              provider: this.name,
              model: request.model,
              latencyMs,
              chunks: chunkCount,
              ...(chunk.usage && {
                promptTokens: chunk.usage.promptTokens,
                completionTokens: chunk.usage.completionTokens,
                totalTokens: chunk.usage.totalTokens,
              }),
            },
            `[${this.name}] Stream completed`
          );
        }
      }
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      this.logger.error(
        {
          provider: this.name,
          model: request.model,
          latencyMs,
          chunks: chunkCount,
          error: err instanceof Error ? err.message : String(err),
        },
        `[${this.name}] Stream failed`
      );
      throw err;
    }
  }
}
