/**
 * Groq Provider — Strategy Pattern Implementation
 *
 * Implements the LLMProvider interface for Groq models using the
 * official OpenAI Node SDK, pointing to Groq's API.
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
import type { ProviderConfig } from './provider.interface';

export class GroqProvider implements LLMProvider {
  readonly name: ProviderName = 'groq';
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.groq.com/openai/v1',
    });
    this.defaultModel = config.defaultModel ?? 'llama-3.1-8b-instant';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel;
    const start = performance.now();

    const payload: any = {
      model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;
    if (request.topP !== undefined) payload.top_p = request.topP;

    const completion = await this.client.chat.completions.create(payload);

    const latencyMs = Math.round(performance.now() - start);

    const choice = completion.choices[0];
    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    };

    return {
      id: completion.id || `groq-${Date.now()}`,
      provider: this.name,
      model: completion.model || model,
      content: choice?.message?.content ?? '',
      usage,
      cached: false,
      latencyMs,
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const model = request.model || this.defaultModel;

    const payload: any = {
      model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
    };

    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;
    if (request.topP !== undefined) payload.top_p = request.topP;

    const stream = await this.client.chat.completions.create(payload) as unknown as AsyncIterable<any>;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      const done = chunk.choices[0]?.finish_reason !== null && chunk.choices[0]?.finish_reason !== undefined;

      yield {
        id: chunk.id,
        content: delta,
        done,
        ...(chunk.usage && {
          usage: {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          },
        }),
      };
    }
  }

  estimateCost(usage: TokenUsage): number {
    const pricing = PROVIDER_PRICING['llama-3.1-8b-instant']; // Default fallback for Groq
    if (!pricing) return 0;

    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    return Number((inputCost + outputCost).toFixed(8));
  }

  listModels(): string[] {
    return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  }
}
