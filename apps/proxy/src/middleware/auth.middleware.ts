/**
 * Auth Middleware — API Key Authentication
 *
 * Fastify preHandler hook that validates incoming API keys.
 *
 * Flow:
 * 1. Extract key from Authorization: Bearer <key> header
 * 2. SHA-256 hash the key
 * 3. Check Redis cache for a recent lookup result
 * 4. If cache miss, query the api_keys table via Prisma
 * 5. Cache the result in Redis for 5 minutes
 * 6. Attach ApiKeyPayload + project info to the request object
 * 7. Return 401 for invalid, expired, or inactive keys
 */

import { createHash } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@aura/db';
import { redis } from '@aura/redis';
import { REDIS_KEYS } from '@aura/shared';
import type { ApiKeyPayload } from '@aura/shared';

/** Cache TTL for API key lookups: 5 minutes */
const CACHE_TTL = 300;

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // ── Extract Bearer token ──────────────────────────
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header. Expected: Bearer <api-key>',
      statusCode: 401,
    });
    return;
  }

  const rawKey = authHeader.slice(7).trim();

  if (!rawKey) {
    reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'API key is empty',
      statusCode: 401,
    });
    return;
  }

  // ── Hash the key (SHA-256) ────────────────────────
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  // ── Check Redis cache first ───────────────────────
  const keyPrefix = rawKey.substring(0, 12);
  const cacheKey = REDIS_KEYS.apiKeyCache(keyPrefix);
  const cachedResult = await redis.get(cacheKey);

  if (cachedResult) {
    try {
      const cached = JSON.parse(cachedResult);

      if (cached.invalid) {
        reply.status(401).send({
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
          statusCode: 401,
        });
        return;
      }

      request.apiKey = cached.apiKey;
      request.project = cached.project;
      return;
    } catch {
      // Invalid cache entry, fall through to DB lookup
      await redis.del(cacheKey);
    }
  }

  // ── Database lookup ───────────────────────────────
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      project: {
        select: {
          id: true,
          budgetLimit: true,
          budgetPeriod: true,
          isActive: true,
          tenantId: true,
        },
      },
    },
  });

  // Key not found
  if (!apiKeyRecord) {
    // Cache the negative result to prevent repeated DB lookups
    await redis.set(cacheKey, JSON.stringify({ invalid: true }), 'EX', CACHE_TTL);

    reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Invalid API key',
      statusCode: 401,
    });
    return;
  }

  // Key is inactive
  if (!apiKeyRecord.isActive) {
    reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'API key has been deactivated',
      statusCode: 401,
    });
    return;
  }

  // Key has expired
  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'API key has expired',
      statusCode: 401,
    });
    return;
  }

  // Project is inactive
  if (!apiKeyRecord.project.isActive) {
    reply.status(403).send({
      code: 'FORBIDDEN',
      message: 'Project is inactive',
      statusCode: 403,
    });
    return;
  }

  // ── Build the payload ─────────────────────────────
  const apiKeyPayload: ApiKeyPayload = {
    keyId: apiKeyRecord.id,
    projectId: apiKeyRecord.projectId,
    tenantId: apiKeyRecord.project.tenantId,
    permissions: apiKeyRecord.permissions,
    rateLimit: apiKeyRecord.rateLimit,
  };

  const projectPayload = {
    id: apiKeyRecord.project.id,
    budgetLimit: apiKeyRecord.project.budgetLimit,
    budgetPeriod: apiKeyRecord.project.budgetPeriod as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    isActive: apiKeyRecord.project.isActive,
  };

  // ── Cache the result ──────────────────────────────
  await redis.set(
    cacheKey,
    JSON.stringify({ apiKey: apiKeyPayload, project: projectPayload }),
    'EX',
    CACHE_TTL
  );

  // ── Update last used timestamp (non-blocking) ─────
  prisma.apiKey
    .update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Non-critical, don't block the request
    });

  // ── Attach to request ─────────────────────────────
  request.apiKey = apiKeyPayload;
  request.project = projectPayload;
}
