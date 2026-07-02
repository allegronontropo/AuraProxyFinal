import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cacheEntries = await prisma.semanticCache.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log("Recent Cache Entries:");
  for (const entry of cacheEntries) {
    console.log({
      id: entry.id,
      prompt: entry.prompt.substring(0, 50) + '...',
      expiresAt: entry.expiresAt,
      isExpired: entry.expiresAt < new Date(),
      provider: entry.provider,
      model: entry.model
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
