import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS } from '@aura/shared';
import type { ApiKeyPayload } from '@aura/shared';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class AuthService {
  private readonly localCache = new Map<string, { value: any; expiresAt: number }>();
  private readonly LOCAL_CACHE_MAX = 500;
  private readonly LOCAL_CACHE_TTL_MS = 30_000;
  private readonly LOCAL_CACHE_INVALID_TTL_MS = 10_000;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  private localGet(key: string): any | null {
    const entry = this.localCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.localCache.delete(key);
      return null;
    }
    return entry.value;
  }

  private localSet(key: string, value: any, ttlMs: number = this.LOCAL_CACHE_TTL_MS): void {
    if (this.localCache.size >= this.LOCAL_CACHE_MAX && !this.localCache.has(key)) {
      const firstKey = this.localCache.keys().next().value;
      if (firstKey !== undefined) this.localCache.delete(firstKey);
    }
    this.localCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  private localDelete(key: string): void {
    this.localCache.delete(key);
  }

  invalidateKey(keyHash: string): void {
    this.localDelete(REDIS_KEYS.apiKeyCache(keyHash));
  }

  async validateApiKey(rawKey: string): Promise<{ apiKey: ApiKeyPayload; project: any }> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const cacheKey = REDIS_KEYS.apiKeyCache(keyHash);

    const localResult = this.localGet(cacheKey);
    if (localResult) {
      if (localResult.invalid) {
        throw new UnauthorizedException('Invalid API key.');
      }
      return localResult;
    }

    const cachedResult = await this.redis.get(cacheKey);
    if (cachedResult) {
      const cached = JSON.parse(cachedResult);
      this.localSet(cacheKey, cached, cached.invalid ? this.LOCAL_CACHE_INVALID_TTL_MS : this.LOCAL_CACHE_TTL_MS);
      if (cached.invalid) {
        throw new UnauthorizedException('Invalid API key.');
      }
      return cached;
    }

    const apiKeyRecord = await this.prisma.client.apiKey.findUnique({
      where: { keyHash },
      include: {
        project: {
          select: {
            id: true,
            budgetLimit: true,
            budgetPeriod: true,
            fallbackModels: true,
            isActive: true,
            tenantId: true,
            tenant: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!apiKeyRecord) {
      await this.redis.set(cacheKey, JSON.stringify({ invalid: true }), CACHE_TTL);
      this.localSet(cacheKey, { invalid: true }, this.LOCAL_CACHE_INVALID_TTL_MS);
      throw new UnauthorizedException('Invalid API key.');
    }

    if (!apiKeyRecord.isActive) {
      throw new UnauthorizedException('API key has been deactivated.');
    }

    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired.');
    }

    if (!apiKeyRecord.project.isActive) {
      throw new ForbiddenException('Project is inactive.');
    }

    if (!apiKeyRecord.project.tenant?.isActive) {
      throw new ForbiddenException('Account has been suspended.');
    }

    const apiKeyPayload: ApiKeyPayload = {
      keyId: apiKeyRecord.id,
      projectId: apiKeyRecord.projectId,
      tenantId: apiKeyRecord.project.tenantId,
      permissions: apiKeyRecord.permissions,
      rateLimit: apiKeyRecord.rateLimit,
    };

    const projectPayload = {
      id: apiKeyRecord.project.id,
      tenantId: apiKeyRecord.project.tenantId,
      budgetLimit: apiKeyRecord.project.budgetLimit,
      budgetPeriod: apiKeyRecord.project.budgetPeriod as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      isActive: apiKeyRecord.project.isActive,
      fallbackModels: apiKeyRecord.project.fallbackModels,
    };

    const result = { apiKey: apiKeyPayload, project: projectPayload };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      CACHE_TTL
    );
    this.localSet(cacheKey, result, this.LOCAL_CACHE_TTL_MS);

    // Update last used timestamp (non-blocking)
    this.prisma.client.apiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return result;
  }

  async validateApiKeyById(keyId: string): Promise<{ apiKey: ApiKeyPayload; project: any }> {
    const cacheKey = REDIS_KEYS.apiKeyCache(`id:${keyId}`);

    const localResult = this.localGet(cacheKey);
    if (localResult) {
      if (localResult.invalid) {
        throw new UnauthorizedException('Invalid API key ID.');
      }
      return localResult;
    }

    const cachedResult = await this.redis.get(cacheKey);
    if (cachedResult) {
      const cached = JSON.parse(cachedResult);
      this.localSet(cacheKey, cached, cached.invalid ? this.LOCAL_CACHE_INVALID_TTL_MS : this.LOCAL_CACHE_TTL_MS);
      if (cached.invalid) {
        throw new UnauthorizedException('Invalid API key ID.');
      }
      return cached;
    }

    const apiKeyRecord = await this.prisma.client.apiKey.findUnique({
      where: { id: keyId },
      include: {
        project: {
          select: {
            id: true,
            budgetLimit: true,
            budgetPeriod: true,
            fallbackModels: true,
            isActive: true,
            tenantId: true,
            tenant: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!apiKeyRecord) {
      await this.redis.set(cacheKey, JSON.stringify({ invalid: true }), CACHE_TTL);
      this.localSet(cacheKey, { invalid: true }, this.LOCAL_CACHE_INVALID_TTL_MS);
      throw new UnauthorizedException('Invalid API key ID.');
    }

    if (!apiKeyRecord.isActive) {
      throw new UnauthorizedException('API key has been deactivated.');
    }

    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired.');
    }

    if (!apiKeyRecord.project.isActive) {
      throw new ForbiddenException('Project is inactive.');
    }

    if (!apiKeyRecord.project.tenant?.isActive) {
      throw new ForbiddenException('Account has been suspended.');
    }

    const apiKeyPayload: ApiKeyPayload = {
      keyId: apiKeyRecord.id,
      projectId: apiKeyRecord.projectId,
      tenantId: apiKeyRecord.project.tenantId,
      permissions: apiKeyRecord.permissions,
      rateLimit: apiKeyRecord.rateLimit,
    };

    const projectPayload = {
      id: apiKeyRecord.project.id,
      tenantId: apiKeyRecord.project.tenantId,
      budgetLimit: apiKeyRecord.project.budgetLimit,
      budgetPeriod: apiKeyRecord.project.budgetPeriod as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      isActive: apiKeyRecord.project.isActive,
      fallbackModels: apiKeyRecord.project.fallbackModels,
    };

    const result = { apiKey: apiKeyPayload, project: projectPayload };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      CACHE_TTL
    );
    this.localSet(cacheKey, result, this.LOCAL_CACHE_TTL_MS);

    // Update last used timestamp (non-blocking)
    this.prisma.client.apiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return result;
  }
}
