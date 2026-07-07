const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alerts = await prisma.alert.findMany({
    where: { projectId: 'cmqylhakz0004m1zobqbjjwvt' }
  });
  console.log("Total Alerts for Aura project:", alerts.length);
  alerts.forEach(a => console.log(`Alert ID: ${a.id} | Title: ${a.title} | Status: ${a.status}`));
}

main().finally(() => prisma.$disconnect());
