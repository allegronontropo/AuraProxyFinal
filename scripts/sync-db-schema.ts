import { prisma } from '../packages/db/src/index';

async function main() {
  try {
    console.log('--- Database Synchronization ---');
    await prisma.$executeRawUnsafe('ALTER TABLE "semantic_cache" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);');
    console.log('✅ Colonne "embedding" ajoutée avec succès.');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
