const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany();
  console.log("PROJECTS:", JSON.stringify(projects, null, 2));
  
  const credentials = await prisma.providerCredential.findMany();
  console.log("CREDENTIALS:", JSON.stringify(credentials, null, 2));
}
main().finally(() => prisma.$disconnect());
