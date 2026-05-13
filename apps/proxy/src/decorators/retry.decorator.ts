/**
 * Retry Decorator — Decorator Pattern
 *
 * Wraps any LLMProvider to add automatic retry on failure.
 * On first failure: waits 1 second, then retries once.
 * On second failure: throws the original error.
 * Logs each retry attempt.
 */

import type {
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from '@aura/shared';
import { BaseDecorator } from './base.decorator';

export class RetryDecorator extends BaseDecorator {
  private maxRetries: number;
  private delayMs: number;

  constructor(
    provider: import('@aura/shared').LLMProvider,
    options?: { maxRetries?: number; delayMs?: number }
  ) {
    super(provider);
    this.maxRetries = options?.maxRetries ?? 1;
    this.delayMs = options?.delayMs ?? 1000;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `[Retry] Attempt ${attempt + 1}/${this.maxRetries + 1} for ${this.name} chat`
          );
        }
        return await this.wrapped.chat(request);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on client errors (4xx range)
        if (this.isClientError(err)) {
          throw lastError;
        }

        if (attempt < this.maxRetries) {
          console.warn(
            `[Retry] ${this.name} chat failed (attempt ${attempt + 1}/${this.maxRetries + 1}): ${lastError.message}. Retrying in ${this.delayMs}ms...`
          );
          await this.sleep(this.delayMs);
        }
      }
    }

    console.error(
      `[Retry] ${this.name} chat failed after ${this.maxRetries + 1} attempts`
    );
    throw lastError!;
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `[Retry] Attempt ${attempt + 1}/${this.maxRetries + 1} for ${this.name} stream`
          );
        }
        yield* this.wrapped.stream(request);
        return; // Success — exit retry loop
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (this.isClientError(err)) {
          throw lastError;
        }

        if (attempt < this.maxRetries) {
          console.warn(
            `[Retry] ${this.name} stream failed (attempt ${attempt + 1}/${this.maxRetries + 1}): ${lastError.message}. Retrying in ${this.delayMs}ms...`
          );
          await this.sleep(this.delayMs);
        }
      }
    }

    console.error(
      `[Retry] ${this.name} stream failed after ${this.maxRetries + 1} attempts`
    );
    throw lastError!;
  }

  private isClientError(err: unknown): boolean {
    if (err && typeof err === 'object') {
      const status = (err as any).status ?? (err as any).statusCode;
      return typeof status === 'number' && status >= 400 && status < 500;
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
