import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS } from '@aura/shared';
import type { ApiKeyPayload } from '@aura/shared';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async validateApiKey(rawKey: string): Promise<{ apiKey: ApiKeyPayload; project: any }> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);
    const cacheKey = REDIS_KEYS.apiKeyCache(keyPrefix);

    const cachedResult = await this.redis.get(cacheKey);
    if (cachedResult) {
      const cached = JSON.parse(cachedResult);
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
            isActive: true,
            tenantId: true,
          },
        },
      },
    });

    if (!apiKeyRecord) {
      await this.redis.set(cacheKey, JSON.stringify({ invalid: true }), CACHE_TTL);
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

    const result = { apiKey: apiKeyPayload, project: projectPayload };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      CACHE_TTL
    );

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
