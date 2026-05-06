/**
 * Anthropic Provider — Strategy Pattern Implementation
 *
 * Implements the LLMProvider interface for Anthropic Claude models
 * using the official @anthropic-ai/sdk. Handles the format differences
 * between Anthropic's API (system message separate) and our unified interface.
 */

import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicProvider implements LLMProvider {
  readonly name: ProviderName = 'anthropic';
  private client: Anthropic;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.defaultModel = config.defaultModel ?? 'claude-3.5-sonnet-20241022';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel;
    const start = performance.now();

    // Anthropic requires system message to be separate from messages array
    const systemMessage = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model,
      max_tokens: request.maxTokens ?? 4096,
      ...(systemMessage && { system: systemMessage }),
      messages,
      temperature: request.temperature ?? 0.7,
    });

    const latencyMs = Math.round(performance.now() - start);

    // Extract text content from Anthropic's response blocks
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const usage: TokenUsage = {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    return {
      id: response.id,
      provider: this.name,
      model: response.model,
      content,
      usage,
      cached: false,
      latencyMs,
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const model = request.model || this.defaultModel;

    // Separate system message
    const systemMessage = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = this.client.messages.stream({
      model,
      max_tokens: request.maxTokens ?? 4096,
      ...(systemMessage && { system: systemMessage }),
      messages,
      temperature: request.temperature ?? 0.7,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          yield {
            id: `stream-${Date.now()}`,
            content: delta.text,
            done: false,
          };
        }
      }

      if (event.type === 'message_delta') {
        if ('usage' in event && event.usage) {
          outputTokens = event.usage.output_tokens;
        }
      }

      if (event.type === 'message_start' && event.message?.usage) {
        inputTokens = event.message.usage.input_tokens;
      }

      if (event.type === 'message_stop') {
        yield {
          id: `stream-${Date.now()}`,
          content: '',
          done: true,
          usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
        };
      }
    }
  }

  estimateCost(usage: TokenUsage): number {
    const pricing = PROVIDER_PRICING['claude-3.5-sonnet'] ?? PROVIDER_PRICING['claude-4-sonnet'];
    if (!pricing) return 0;

    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    return Number((inputCost + outputCost).toFixed(8));
  }

  listModels(): string[] {
    return ['claude-4-sonnet', 'claude-3.5-sonnet', 'claude-3.5-haiku', 'claude-3-opus'];
  }
}
