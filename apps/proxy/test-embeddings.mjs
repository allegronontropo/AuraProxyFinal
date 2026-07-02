import { pipeline } from '@xenova/transformers';

async function main() {
  console.log('Loading pipeline...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  console.log('Generating for A...');
  const outA = await extractor("what's a llm proxy", { pooling: 'mean', normalize: true });
  const vecA = Array.from(outA.data);

  console.log('Generating for B...');
  const outB = await extractor("whats dockerisation with docker", { pooling: 'mean', normalize: true });
  const vecB = Array.from(outB.data);

  let dotProduct = 0;
  for (let i = 0; i < 384; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  console.log(`Cosine similarity: ${dotProduct}`);
  console.log('Vector A slice:', vecA.slice(0, 5));
  console.log('Vector B slice:', vecB.slice(0, 5));
}

main().catch(console.error);
