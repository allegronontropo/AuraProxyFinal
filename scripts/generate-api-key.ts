import { prisma } from '../packages/db/src/index';
import { createHash } from 'crypto';

async function main() {
  const projectId = 'cmpdfuxdc0002m13seidijh1g';
  const clearKey = 'aura_dev_test_key_2026_rapport_stage';
  const keyHash = createHash('sha256').update(clearKey).digest('hex');
  const keyPrefix = 'aura_dev';

  console.log('--- API Key Generation ---');
  console.log('Project ID:', projectId);
  console.log('Clear-text Key (COPIE MOI DANS POSTMAN):', clearKey);
  console.log('Key Hash (pour la base de données):', keyHash);

  try {
    const newKey = await prisma.apiKey.create({
      data: {
        projectId,
        keyHash,
        keyPrefix,
        name: 'Rapport Stage Test Key',
        permissions: ['chat:write', 'models:read', 'chat', 'completions'], // Large permissions
        rateLimit: 1000,
        isActive: true,
      },
    });

    console.log('\n✅ Succès ! La clé a été insérée en base de données.');
    console.log('ID de l\'enregistrement:', newKey.id);
  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'insertion:', error.message);
    if (error.code === 'P2002') {
      console.log('Note: Cette clé (ou son hash) existe déjà peut-être.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
