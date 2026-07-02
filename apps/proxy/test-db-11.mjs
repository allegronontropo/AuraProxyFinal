import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  const apiKey = await prisma.apiKey.findFirst();
  
  // Simulate what CacheService returns
  const cacheHit = await prisma.semanticCache.findFirst({
    where: { hitCount: { gt: 0 } },
    orderBy: { createdAt: 'desc' }
  });

  if (!cacheHit) {
    console.log("No cache hit found");
    return;
  }

  const response = cacheHit.response;
  response.cached = true;

  try {
    const log = await prisma.requestLog.create({
      data: {
        apiKeyId: apiKey.id,
        projectId: project.id,
        provider: response?.provider ?? 'unknown',
        model: response?.model ?? 'unknown',
        tokensIn: response?.usage?.promptTokens ?? 0,
        tokensOut: response?.usage?.completionTokens ?? 0,
        costUsd: 0,
        latencyMs: response.latencyMs ?? 50,
        statusCode: 200,
        cached: response.cached ?? false,
        error: undefined,
      },
    });
    console.log("Log created successfully!", log.id);
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
