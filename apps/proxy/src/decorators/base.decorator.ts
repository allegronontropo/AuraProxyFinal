/**
 * Base Decorator — Decorator Pattern
 *
 * Abstract class that wraps an LLMProvider and delegates all method calls
 * to the wrapped provider. Subclasses override specific methods to add
 * cross-cutting behavior (logging, cost tracking, retry, etc.) without
 * modifying the original provider classes.
 */

import type {
  LLMProvider,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  TokenUsage,
  ProviderName,
} from '@aura/shared';

export abstract class BaseDecorator implements LLMProvider {
  protected readonly wrapped: LLMProvider;

  constructor(provider: LLMProvider) {
    this.wrapped = provider;
  }

  get name(): ProviderName {
    return this.wrapped.name;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.wrapped.chat(request);
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    yield* this.wrapped.stream(request);
  }

  estimateCost(usage: TokenUsage): number {
    return this.wrapped.estimateCost(usage);
  }

  listModels(): string[] {
    return this.wrapped.listModels();
  }
}
