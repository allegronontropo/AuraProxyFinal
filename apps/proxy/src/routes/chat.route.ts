/**
 * Chat Route — POST /v1/chat/completions
 *
 * OpenAI-compatible chat completions endpoint.
 * Validates the request, resolves the provider, and forwards the request.
 *
 * Middleware chain (preHandler):
 *   1. authMiddleware — validates API key
 *   2. rateLimiterMiddleware — sliding window rate limiter
 *   3. budgetGuardMiddleware — checks project budget
 */

import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { providerFactory } from '../providers/provider.factory.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { budgetGuardMiddleware } from '../middleware/budget-guard.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rate-limiter.middleware.js';
import { budgetService } from '../services/budget.service.js';
import type { ChatRequest, ProviderName } from '@aura/shared';

// ============================================
// Request Validation Schema
// ============================================

const chatRequestSchema = z.object({
  model: z.string().min(1, 'model is required'),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1, 'messages must contain at least one message'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional().default(false),
});

// ============================================
// Route Registration
// ============================================

export async function chatRoute(app: FastifyInstance): Promise<void> {
  app.post(
    '/v1/chat/completions',
    {
      preHandler: [authMiddleware, rateLimiterMiddleware, budgetGuardMiddleware],
    },
    async (request, reply) => {
      // ── Validate request body ───────────────────────────
      const parsed = chatRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          statusCode: 400,
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const body = parsed.data;

      // ── Resolve provider ────────────────────────────────
      const providerHeader = (request.headers['x-provider'] as string | undefined)?.toLowerCase();

      let provider;
      try {
        if (providerHeader && providerFactory.has(providerHeader)) {
          provider = providerFactory.get(providerHeader);
        } else {
          provider = providerFactory.resolveFromModel(body.model);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Provider not found';
        return reply.status(400).send({
          code: 'PROVIDER_NOT_FOUND',
          message,
          statusCode: 400,
        });
      }

      // ── Build ChatRequest ───────────────────────────────
      const chatRequest: ChatRequest = {
        provider: provider.name as ProviderName,
        model: body.model,
        messages: body.messages,
        temperature: body.temperature,
        maxTokens: body.max_tokens,
        stream: body.stream,
        apiKeyId: request.apiKey.keyId,
      };

      // ── Streaming (basic — will be enhanced in Phase 5) ──
      if (body.stream) {
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        try {
          for await (const chunk of provider.stream(chatRequest)) {
            reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          reply.raw.write('data: [DONE]\n\n');

          // Record the cost after stream completes
          const estimatedCost = provider.estimateCost({
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          });
          if (estimatedCost > 0) {
            budgetService
              .recordSpend(request.project.id, estimatedCost, request.project.budgetPeriod)
              .catch((err) => {
                app.log.error({ err }, 'Failed to record streaming spend');
              });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error';
          app.log.error({ err }, 'Streaming error');
          reply.raw.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        } finally {
          reply.raw.end();
        }
        return;
      }

      // ── Non-streaming ───────────────────────────────────
      try {
        app.log.info(
          { provider: provider.name, model: body.model, apiKeyId: request.apiKey.keyId },
          'Chat request started'
        );

        const response = await provider.chat(chatRequest);
        const cost = provider.estimateCost(response.usage);

        app.log.info(
          {
            provider: provider.name,
            model: response.model,
            latencyMs: response.latencyMs,
            tokens: response.usage.totalTokens,
            cost: `$${cost.toFixed(6)}`,
          },
          'Chat request completed'
        );

        // Record the spend in the budget counter
        if (cost > 0) {
          budgetService
            .recordSpend(request.project.id, cost, request.project.budgetPeriod)
            .catch((err) => {
              app.log.error({ err }, 'Failed to record spend');
            });
        }

        return reply.status(200).send(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        app.log.error({ err }, 'Chat request failed');

        return reply.status(502).send({
          code: 'PROVIDER_ERROR',
          message: `Provider "${provider.name}" error: ${message}`,
          statusCode: 502,
        });
      }
    }
  );
}
