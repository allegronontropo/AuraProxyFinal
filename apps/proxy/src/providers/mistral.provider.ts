/**
 * Mistral Provider — Strategy Pattern Implementation
 *
 * Implements the LLMProvider interface for Mistral AI models
 * using the official @mistralai/mistralai SDK.
 */

import { Mistral } from '@mistralai/mistralai';
import { PROVIDER_PRICING } from '@aura/shared';
import type {
  LLMProvider,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  TokenUsage,
  ProviderName,
} from '@aura/shared';
import type { ProviderConfig } from './provider.interface.js';

export class MistralProvider implements LLMProvider {
  readonly name: ProviderName = 'mistral';
  private client: Mistral;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.client = new Mistral({
      apiKey: config.apiKey,
      ...(config.baseUrl && { serverURL: config.baseUrl }),
    });
    this.defaultModel = config.defaultModel ?? 'mistral-small-latest';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel;
    const start = performance.now();

    const response = await this.client.chat.complete({
      model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens,
    });

    const latencyMs = Math.round(performance.now() - start);

    const choice = response.choices?.[0];
    const content =
      typeof choice?.message?.content === 'string'
        ? choice.message.content
        : Array.isArray(choice?.message?.content)
          ? choice.message.content.map((c: any) => (typeof c === 'string' ? c : c.text ?? '')).join('')
          : '';

    const usage: TokenUsage = {
      promptTokens: response.usage?.promptTokens ?? 0,
      completionTokens: response.usage?.completionTokens ?? 0,
      totalTokens: response.usage?.totalTokens ?? 0,
    };

    return {
      id: response.id ?? `mistral-${Date.now()}`,
      provider: this.name,
      model: response.model ?? model,
      content,
      usage,
      cached: false,
      latencyMs,
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const model = request.model || this.defaultModel;

    const stream = await this.client.chat.stream({
      model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens,
    });

    let promptTokens = 0;
    let completionTokens = 0;

    for await (const event of stream) {
      const chunk = event.data;
      const choice = chunk.choices?.[0];

      if (!choice) continue;

      const delta =
        typeof choice.delta?.content === 'string'
          ? choice.delta.content
          : '';

      const done = choice.finishReason !== null && choice.finishReason !== undefined;

      // Capture usage from the final chunk if available
      if (chunk.usage) {
        promptTokens = chunk.usage.promptTokens ?? 0;
        completionTokens = chunk.usage.completionTokens ?? 0;
      }

      yield {
        id: chunk.id ?? `mistral-stream-${Date.now()}`,
        content: delta,
        done,
        ...(done && {
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          },
        }),
      };
    }
  }

  estimateCost(usage: TokenUsage): number {
    const pricing = PROVIDER_PRICING['mistral-small'];
    if (!pricing) return 0;

    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    return Number((inputCost + outputCost).toFixed(8));
  }

  listModels(): string[] {
    return ['mistral-large', 'mistral-medium', 'mistral-small'];
  }
}
