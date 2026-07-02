import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cacheEntries = await prisma.semanticCache.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log("Recent Cache Entries in DB:");
  for (const entry of cacheEntries) {
    console.log({
      id: entry.id,
      promptHash: entry.promptHash,
      hitCount: entry.hitCount,
      createdAt: entry.createdAt,
      provider: entry.provider,
      model: entry.model
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
