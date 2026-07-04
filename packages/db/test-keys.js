const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const keys = await prisma.apiKey.findMany();
  console.log("API KEYS:", JSON.stringify(keys, null, 2));
}
main().finally(() => prisma.$disconnect());
