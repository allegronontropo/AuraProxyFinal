const apiKey = "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";

async function testEmbedding() {
  const model = "nvidia/llama-nemotron-embed-vl-1b-v2";
  const text = "A".repeat(1500); // 1500 chars
  console.log(`\nTesting model: ${model} with dimensions: 1536`);
  const start = Date.now();
  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: [text],
        model: model,
        input_type: "query",
        dimensions: 1536
      })
    });

    const data = await response.json();
    const ms = Date.now() - start;
    if (!response.ok) {
      console.log(`Error (${ms}ms): ${JSON.stringify(data)}`);
    } else {
      const dim = data.data[0].embedding.length;
      console.log(`Success! Dimension: ${dim} in ${ms}ms`);
    }
  } catch (err) {
    console.log(`Fetch error:`, err);
  }
}

testEmbedding();
