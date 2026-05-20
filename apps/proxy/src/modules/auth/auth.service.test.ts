import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

function createService(overrides?: {
  apiKeyRecord?: any;
  cached?: string | null;
}) {
  const redis = {
    get: vi.fn().mockResolvedValue(overrides?.cached ?? null),
    set: vi.fn().mockResolvedValue(undefined),
  };
  const prisma = {
    client: {
      apiKey: {
        findUnique: vi.fn().mockResolvedValue(overrides?.apiKeyRecord ?? null),
        update: vi.fn().mockResolvedValue(undefined),
      },
    },
  };

  return {
    service: new AuthService(prisma as any, redis as any),
    prisma,
    redis,
  };
}

describe('AuthService', () => {
  it('caches API key validation by full key hash, not by public prefix', async () => {
    const rawKey = 'aura_sk_sameprefix_secret_one';
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const { service, redis } = createService({
      apiKeyRecord: {
        id: 'key_1',
        projectId: 'project_1',
        permissions: ['chat'],
        rateLimit: 60,
        isActive: true,
        expiresAt: null,
        project: {
          id: 'project_1',
          tenantId: 'tenant_1',
          budgetLimit: 100,
          budgetPeriod: 'MONTHLY',
          isActive: true,
        },
      },
    });

    await service.validateApiKey(rawKey);

    expect(redis.get).toHaveBeenCalledWith(`aura:key:${keyHash}`);
    expect(redis.set).toHaveBeenCalledWith(
      `aura:key:${keyHash}`,
      expect.any(String),
      300,
    );
  });

  it('stores invalid-key cache entries under the full attempted key hash', async () => {
    const rawKey = 'aura_sk_sameprefix_bad_secret';
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const { service, redis } = createService();

    await expect(service.validateApiKey(rawKey)).rejects.toBeInstanceOf(UnauthorizedException);

    expect(redis.set).toHaveBeenCalledWith(
      `aura:key:${keyHash}`,
      JSON.stringify({ invalid: true }),
      300,
    );
  });
});
