import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';

const prisma = new PrismaClient();

async function main() {
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  const prompt1 = `system: You are a helpful AI assistant.\nuser: what is vercel please explain`;
  const prompt2 = `system: You are a helpful AI assistant.\nuser: can you explain what vercel is`;
  
  const out1 = await extractor(prompt1, { pooling: 'mean', normalize: true });
  const out2 = await extractor(prompt2, { pooling: 'mean', normalize: true });

  const vec1 = `[${Array.from(out1.data).join(',')}]`;
  const vec2 = `[${Array.from(out2.data).join(',')}]`;

  console.log("Testing Prisma QueryRaw...");
  const threshold = 0.95;

  const results = await prisma.$queryRawUnsafe(`
    SELECT 
      id,
      prompt_hash,
      1 - (embedding <=> '${vec2}'::vector) as similarity
    FROM semantic_cache
    WHERE 1 - (embedding <=> '${vec2}'::vector) > ${threshold}::float
    ORDER BY similarity DESC
    LIMIT 5
  `);
  
  console.log('Matches:', results);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
