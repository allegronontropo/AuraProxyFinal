import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';

const prisma = new PrismaClient();

async function main() {
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  const promptB = `system: You are a helpful AI assistant.
user: what's a llm proxy
assistant: An LLM proxy (Large Language Model proxy) is essentially...
user: whats dockerisation with docker`;

  const outB = await extractor(promptB, { pooling: 'mean', normalize: true });
  const vecB = `[${Array.from(outB.data).join(',')}]`;

  const threshold = 0.95;

  const results = await prisma.$queryRawUnsafe(`
    SELECT 
      id,
      prompt_hash,
      1 - (embedding <=> '${vecB}'::vector) as similarity
    FROM semantic_cache
    WHERE 1 - (embedding <=> '${vecB}'::vector) > ${threshold}::float
    ORDER BY similarity DESC
    LIMIT 5
  `);
  
  console.log('Matches:', results);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
