/**
 * @aura/db - Singleton PrismaClient
 *
 * Motif de conception : Singleton
 * Assure qu'un seul pool de connexions à la base de données est partagé par
 * tous les modules de l'application, évitant l'épuisement des connexions.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
      },
    },
    // Increase connection pool for better handling of concurrent requests
    // Only apply in production or when explicitly set
    ...(process.env.NODE_ENV === 'production' && {
      // Pool settings can be controlled via DATABASE_URL query params
      // ?connection_limit=20&pool_timeout=30
    }),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ré-exporte les types Prisma pour plus de commodité
export * from '@prisma/client';
