/**
 * OpenAI Provider — Strategy Pattern Implementation
 *
 * Implements the LLMProvider interface for OpenAI models using the
 * official OpenAI Node SDK. Supports chat completions and streaming.
 */

import OpenAI from 'openai';
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

export class OpenAIProvider implements LLMProvider {
  readonly name: ProviderName = 'openai';
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.defaultModel = config.defaultModel ?? 'gpt-4o-mini';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel;
    const start = performance.now();

    const completion = await this.client.chat.completions.create({
      model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    });

    const latencyMs = Math.round(performance.now() - start);

    const choice = completion.choices[0];
    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    };

    return {
      id: completion.id,
      provider: this.name,
      model: completion.model,
      content: choice?.message?.content ?? '',
      usage,
      cached: false,
      latencyMs,
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const model = request.model || this.defaultModel;

    const stream = await this.client.chat.completions.create({
      model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream: true,
    });

    let totalContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      totalContent += delta;
      const done = chunk.choices[0]?.finish_reason !== null;

      yield {
        id: chunk.id,
        content: delta,
        done,
        ...(done && {
          usage: {
            promptTokens: 0,   // OpenAI doesn't provide usage in stream chunks by default
            completionTokens: 0,
            totalTokens: 0,
          },
        }),
      };
    }
  }

  estimateCost(usage: TokenUsage): number {
    // Try to get specific model pricing, fall back to gpt-4o-mini
    const pricing = PROVIDER_PRICING['gpt-4o-mini'];
    if (!pricing) return 0;

    // PROVIDER_PRICING is per 1M tokens
    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    return Number((inputCost + outputCost).toFixed(8));
  }

  listModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }
}
