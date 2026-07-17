const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE semantic_cache ALTER COLUMN embedding TYPE vector(384);');
    console.log('Successfully altered embedding column to vector(384)');
  } catch (e) {
    console.error('Error altering column:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
