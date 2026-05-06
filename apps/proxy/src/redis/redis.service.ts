import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { redis } from '@aura/redis';
import type { Redis } from '@aura/redis';

/**
 * @pattern Singleton
 * RedisService provides a shared connection to the Redis cache.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  public client: Redis = redis;

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Helper methods for common operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
