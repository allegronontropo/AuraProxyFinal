const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.requestLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("LAST 5 LOGS:", JSON.stringify(logs, null, 2));
}
main().finally(() => prisma.$disconnect());
