/**
 * Gemini Provider — Strategy Pattern Implementation
 *
 * Implements the LLMProvider interface for Google Gemini models using the
 * @google/generative-ai SDK.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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

export class GeminiProvider implements LLMProvider {
  readonly name: ProviderName = 'google';
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.defaultModel = config.defaultModel ?? 'gemini-1.5-flash';
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const modelName = request.model || this.defaultModel;
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const start = performance.now();

    // Map messages to Gemini format
    const history = request.messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    
    const lastMessage = request.messages[request.messages.length - 1].content;

    const chatSession = model.startChat({
      history,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      },
    });

    const result = await chatSession.sendMessage(lastMessage);
    const response = await result.response;
    const latencyMs = Math.round(performance.now() - start);

    const usage: TokenUsage = {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
    };

    return {
      id: `gemini-${Date.now()}`,
      provider: this.name,
      model: modelName,
      content: response.text(),
      usage,
      cached: false,
      latencyMs,
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const modelName = request.model || this.defaultModel;
    const model = this.genAI.getGenerativeModel({ model: modelName });

    const history = request.messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    
    const lastMessage = request.messages[request.messages.length - 1].content;

    const chatSession = model.startChat({
      history,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      },
    });

    const result = await chatSession.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      const usage = chunk.usageMetadata ? {
        promptTokens: chunk.usageMetadata.promptTokenCount,
        completionTokens: chunk.usageMetadata.candidatesTokenCount,
        totalTokens: chunk.usageMetadata.totalTokenCount,
      } : undefined;

      yield {
        id: `gemini-${Date.now()}`,
        content: chunkText,
        done: false,
        usage,
      };
    }

    // Final chunk to signal completion
    yield {
      id: `gemini-${Date.now()}`,
      content: '',
      done: true,
    };
  }

  estimateCost(usage: TokenUsage): number {
    const pricing = PROVIDER_PRICING['gemini-1.5-flash'];
    if (!pricing) return 0;

    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    return Number((inputCost + outputCost).toFixed(8));
  }

  listModels(): string[] {
    return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
  }
}
