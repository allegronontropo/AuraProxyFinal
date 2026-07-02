import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPrompt(prompt) {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

async function main() {
  const prompt = `system: You are a helpful AI assistant.\nuser: whats vercel`;
  const promptHash = hashPrompt(prompt);

  console.log("Looking for hash:", promptHash);

  const exactMatches = await prisma.semanticCache.findMany({
    where: {
      promptHash: promptHash,
    },
  });

  console.log("Exact Matches:", exactMatches.length);
  
  if (exactMatches.length === 0) {
    const allCaches = await prisma.semanticCache.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log("Recent caches:", allCaches.map(c => ({ hash: c.promptHash })));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
