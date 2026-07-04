/**
 * Cost Tracker Decorator — Decorator Pattern
 *
 * Wraps any LLMProvider to record usage data after each response.
 * Inserts a RequestLog row into PostgreSQL via Prisma with:
 * apiKeyId, provider, model, tokensIn, tokensOut, costUsd, latencyMs.
 */

import type { PrismaClient } from '@prisma/client';
import type {
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from '@aura/shared';
import { BaseDecorator } from './base.decorator';

export class CostTrackerDecorator extends BaseDecorator {
  private prisma: PrismaClient;

  constructor(provider: import('@aura/shared').LLMProvider, prisma: PrismaClient) {
    super(provider);
    this.prisma = prisma;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = performance.now();
    const response = await this.wrapped.chat(request);
    const llmLatencyMs = Math.round(performance.now() - start);

    const costUsd = this.estimateCost(response.usage);
    const authLatencyMs = request.authLatencyMs ?? 0;
    const cacheLatencyMs = request.cacheLatencyMs ?? 0;
    const latencyMs = authLatencyMs + cacheLatencyMs + llmLatencyMs;

    // Record the request log asynchronously — don't block the response
    this.recordLog({
      apiKeyId: request.apiKeyId,
      provider: this.name,
      model: response.model,
      tokensIn: response.usage.promptTokens,
      tokensOut: response.usage.completionTokens,
      costUsd,
      authLatencyMs,
      cacheLatencyMs,
      llmLatencyMs,
      latencyMs,
      cached: response.cached,
      statusCode: 200,
      metadata: request.metadata,
    }).catch((err) => {
      console.error('[CostTracker] Failed to record log:', err);
    });

    return response;
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const start = performance.now();
    let finalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const chunk of this.wrapped.stream(request)) {
      yield chunk;

      if (chunk.done && chunk.usage) {
        finalUsage = chunk.usage;
      }
    }

    const llmLatencyMs = Math.round(performance.now() - start);
    const costUsd = this.estimateCost(finalUsage);
    const authLatencyMs = request.authLatencyMs ?? 0;
    const cacheLatencyMs = request.cacheLatencyMs ?? 0;
    const latencyMs = authLatencyMs + cacheLatencyMs + llmLatencyMs;

    // Record after stream completes
    this.recordLog({
      apiKeyId: request.apiKeyId,
      provider: this.name,
      model: request.model,
      tokensIn: finalUsage.promptTokens,
      tokensOut: finalUsage.completionTokens,
      costUsd,
      authLatencyMs,
      cacheLatencyMs,
      llmLatencyMs,
      latencyMs,
      cached: false,
      statusCode: 200,
    }).catch((err) => {
      console.error('[CostTracker] Failed to record stream log:', err);
    });
  }

  private async recordLog(data: {
    apiKeyId?: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    authLatencyMs?: number;
    cacheLatencyMs?: number;
    llmLatencyMs?: number;
    cached: boolean;
    statusCode: number;
    metadata?: any;
  }): Promise<void> {
    // Only record if we have an apiKeyId (authenticated requests)
    // For unauthenticated requests (Phase 2), we skip DB logging
    if (!data.apiKeyId) {
      return;
    }

    // Look up the API key to get the projectId
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: data.apiKeyId },
      select: { projectId: true },
    });

    if (!apiKey) {
      console.warn(`[CostTracker] API key ${data.apiKeyId} not found, skipping log`);
      return;
    }

    await this.prisma.requestLog.create({
      data: {
        apiKeyId: data.apiKeyId,
        projectId: apiKey.projectId,
        provider: data.provider,
        model: data.model,
        tokensIn: data.tokensIn,
        tokensOut: data.tokensOut,
        costUsd: data.costUsd,
        authLatencyMs: data.authLatencyMs ?? 0,
        cacheLatencyMs: data.cacheLatencyMs ?? 0,
        llmLatencyMs: data.llmLatencyMs ?? data.latencyMs,
        latencyMs: data.latencyMs,
        statusCode: data.statusCode,
        cached: data.cached,
        metadata: data.metadata ? data.metadata : undefined,
      },
    });
  }
}
