import { prisma } from '../packages/db/src/index';
import { createHash } from 'crypto';

async function seed() {
  const projectId = 'cmpdfuxdc0002m13seidijh1g';
  const prompt = "Explain the Strategy pattern in 3 sentences."; 
  
  // Formatage identique à ChatService.formatPrompt
  const formattedPrompt = `user: ${prompt}`;
  const promptHash = createHash('sha256').update(formattedPrompt).digest('hex');
  
  const parameters = { temperature: null, maxTokens: null, topP: null };
  const sortedKeys = Object.keys(parameters).sort();
  const stable: any = {};
  for (const key of sortedKeys) {
    stable[key] = (parameters as any)[key];
  }
  const parametersHash = createHash('sha256').update(JSON.stringify(stable)).digest('hex');

  console.log('--- Simulation de Cache Production ---');
  console.log('Project ID:', projectId);
  console.log('Prompt Hash:', promptHash);

  // Generate a random vector of 1536 dims
  const dummyVector = new Array(1536).fill(0).map(() => Math.random());
  const vectorString = `[${dummyVector.join(',')}]`;

  try {
    const response = {
      id: 'fake-res-123',
      content: "Le pattern Strategy est un pattern de conception comportemental. Il permet de définir une famille d'algorithmes et de les rendre interchangeables. Cela facilite le changement de logique au runtime.",
      usage: { promptTokens: 10, completionTokens: 30, totalTokens: 40 },
      model: 'gpt-4o-mini',
      provider: 'openai',
      cached: true,
      latencyMs: 5
    };

    // Use raw SQL to handle the vector type
    await prisma.$executeRawUnsafe(`
      INSERT INTO semantic_cache (id, project_id, provider, prompt_hash, parameters_hash, model, embedding, response, expires_at, created_at)
      VALUES (
        'cache_seed_123',
        '${projectId}',
        'openai',
        '${promptHash}',
        '${parametersHash}',
        'gpt-4o-mini',
        '${vectorString}'::vector,
        '${JSON.stringify(response).replace(/'/g, "''")}'::jsonb,
        NOW() + interval '7 days',
        NOW()
      )
      ON CONFLICT (project_id, provider, model, prompt_hash, parameters_hash) DO UPDATE SET
        embedding = EXCLUDED.embedding,
        response = EXCLUDED.response,
        expires_at = EXCLUDED.expires_at
    `);

    console.log("\n✅ Cache simulé avec succès avec support vectoriel.");
  } catch (error: any) {
    console.error("\n❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
