import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const caches = await prisma.$queryRaw`
    SELECT id, prompt_hash, response, embedding::text
    FROM semantic_cache
  `;
  console.log('Cache entries count:', caches.length);
  for (const c of caches) {
    console.log(`ID: ${c.id}`);
    console.log(`Prompt Hash: ${c.prompt_hash}`);
    const v = JSON.parse(c.embedding);
    console.log(`Embedding sample: ${v.slice(0, 5)}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
