/**
 * ProviderCredentialsService
 *
 * Loads per-project provider API keys from the database (stored AES-256-GCM encrypted).
 * Falls back to environment-variable keys when no project-specific credential is configured.
 *
 * Results are cached in memory for 5 minutes to avoid a DB query on every request.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { decrypt } from '../../common/utils/crypto.util';

interface CacheEntry {
  apiKey: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class ProviderCredentialsService {
  private readonly logger = new Logger(ProviderCredentialsService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  /**
   * Resolves the API key to use for a given provider and project.
   *
   * Order of precedence:
   *   1. Active ProviderCredential row for this (projectId, provider)
   *   2. Environment variable (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
   */
  async resolveApiKey(projectId: string, provider: string): Promise<string | null> {
    const cacheKey = `${projectId}:${provider}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.apiKey;
    }

    let resolvedKey: string | null = null;

    try {
      const credential = await this.prisma.client.providerCredential.findUnique({
        where: {
          projectId_provider: { projectId, provider },
        },
        select: { apiKey: true, isActive: true },
      });

      if (credential?.isActive && credential.apiKey) {
        resolvedKey = decrypt(credential.apiKey);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to load credential for ${provider}/${projectId}: ${err.message}`);
    }

    // Fall back to env var if no project credential found
    if (!resolvedKey) {
      resolvedKey = this.getEnvKey(provider);
    }

    this.cache.set(cacheKey, { apiKey: resolvedKey, expiresAt: Date.now() + CACHE_TTL_MS });
    return resolvedKey;
  }

  /**
   * Invalidates the cache entry so the next request re-fetches from the DB.
   * Call after saving or deleting a credential.
   */
  invalidate(projectId: string, provider: string): void {
    this.cache.delete(`${projectId}:${provider}`);
  }

  private getEnvKey(provider: string): string | null {
    const map: Record<string, string | undefined> = {
      openai:    process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google:    process.env.GOOGLE_API_KEY,
      mistral:   process.env.MISTRAL_API_KEY,
    };
    return map[provider.toLowerCase()] ?? null;
  }
}
