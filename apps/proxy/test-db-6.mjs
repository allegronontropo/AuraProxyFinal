import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  
  const input = {
    projectId: project.id,
    provider: 'google',
    model: 'gemini-2.5-flash',
    promptHash: 'testhash123',
    parametersHash: 'testparamhash123',
  };

  const vectorString = `[${new Array(384).fill(0).join(',')}]`;
  const response = { test: 'response' };
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const id = `cache_${crypto.randomUUID()}`;

  try {
    await prisma.$executeRaw`
      INSERT INTO semantic_cache (id, project_id, provider, prompt_hash, parameters_hash, model, embedding, response, expires_at, created_at)
      VALUES (
        ${id}, 
        ${input.projectId},
        ${input.provider},
        ${input.promptHash}, 
        ${input.parametersHash},
        ${input.model}, 
        ${vectorString}::vector, 
        ${JSON.stringify(response)}::jsonb, 
        ${expiresAt},
        NOW()
      )
    `;
    console.log("Insert successful!");
  } catch (err) {
    console.error("Insert failed:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
