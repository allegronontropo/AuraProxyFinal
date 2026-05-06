/**
 * @aura/db — Singleton PrismaClient
 *
 * Design Pattern: Singleton
 * Ensures a single database connection pool is shared across
 * all modules in the application, preventing connection exhaustion.
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
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma types for convenience
export * from '@prisma/client';
export default prisma;
