import { pipeline } from '@xenova/transformers';

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  const prompt1 = `system: You are a helpful AI assistant.\nuser: whats vercel`;
  const prompt2 = `system: You are a helpful AI assistant.\nuser: what's vercel`;
  const prompt3 = `system: You are a helpful AI assistant.\nuser: is vercel a cloud platform ?`;
  
  const out1 = await extractor(prompt1, { pooling: 'mean', normalize: true });
  const out2 = await extractor(prompt2, { pooling: 'mean', normalize: true });
  const out3 = await extractor(prompt3, { pooling: 'mean', normalize: true });

  const vec1 = Array.from(out1.data);
  const vec2 = Array.from(out2.data);
  const vec3 = Array.from(out3.data);

  console.log("Sim 'whats vercel' vs 'what\\'s vercel':", cosineSimilarity(vec1, vec2));
  console.log("Sim 'whats vercel' vs 'is vercel a cloud platform':", cosineSimilarity(vec1, vec3));
}

main().catch(console.error);
