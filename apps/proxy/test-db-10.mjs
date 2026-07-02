import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.requestLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log("Recent Request Logs in DB:");
  for (const log of logs) {
    console.log({
      id: log.id,
      tokensIn: log.tokensIn,
      tokensOut: log.tokensOut,
      latencyMs: log.latencyMs,
      cached: log.cached,
      createdAt: log.createdAt,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
