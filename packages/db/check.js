const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alerts = await prisma.alert.findMany();
  console.log("Total Alerts in DB:", alerts.length);
  alerts.forEach(a => console.log(`Alert ID: ${a.id} | Project ID: ${a.projectId} | Title: ${a.title} | Status: ${a.status}`));
}

main().finally(() => prisma.$disconnect());
