/**
 * @aura/redis - Client Redis Singleton
 *
 * Motif de conception : Singleton
 * Assure qu'une seule connexion Redis est partagée dans toute l'application.
 * Utilise ioredis avec reconnexion automatique et gestion des erreurs.
 */

import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 10) {
        console.error('[Redis] Max reconnection attempts reached');
        return null; // Arrêter les tentatives de reconnexion
      }
      const delay = Math.min(times * 200, 5000);
      console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    lazyConnect: false,
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] Error:', err.message);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export { Redis };
