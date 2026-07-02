import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';

const prisma = new PrismaClient();

async function main() {
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  const outA = await extractor("what's a llm proxy", { pooling: 'mean', normalize: true });
  const vecA = `[${Array.from(outA.data).join(',')}]`;

  const outB = await extractor("whats dockerisation with docker", { pooling: 'mean', normalize: true });
  const vecB = `[${Array.from(outB.data).join(',')}]`;

  const res = await prisma.$queryRawUnsafe(`SELECT 1 - ('${vecA}'::vector <=> '${vecB}'::vector) as sim`);
  console.log('Postgres similarity:', res);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
