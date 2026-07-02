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

  const prompt1 = `system: You are a helpful AI assistant.\nuser: what is vercel please explain`;
  const prompt2 = `system: You are a helpful AI assistant.\nuser: can you explain what vercel is`;
  const prompt3 = `system: You are a helpful AI assistant.\nuser: what's vercel`;
  const prompt4 = `system: You are a helpful AI assistant.\nuser: whats vercel`;
  
  const out1 = await extractor(prompt1, { pooling: 'mean', normalize: true });
  const out2 = await extractor(prompt2, { pooling: 'mean', normalize: true });
  const out3 = await extractor(prompt3, { pooling: 'mean', normalize: true });
  const out4 = await extractor(prompt4, { pooling: 'mean', normalize: true });

  console.log("Sim 1 vs 2:", cosineSimilarity(Array.from(out1.data), Array.from(out2.data)));
  console.log("Sim 3 vs 4:", cosineSimilarity(Array.from(out3.data), Array.from(out4.data)));
}

main().catch(console.error);
