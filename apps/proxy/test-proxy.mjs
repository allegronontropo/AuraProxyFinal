import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apiKey = await prisma.apiKey.findFirst();
  if (!apiKey) throw new Error("No API keys found");

  const secret = process.env.INTERNAL_DASHBOARD_BYPASS_SECRET || "playground_bypass_secret_local";
  const body = {
    model: "gemini-2.5-flash",
    messages: [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: "what's is semantic cache" }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: false,
  };

  console.log("Using API Key ID:", apiKey.id);
  console.log("Sending request to proxy...");
  
  const res = await fetch("http://localhost:3000/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secret}`,
      "x-dashboard-api-key-id": apiKey.id,
      "x-provider": "google",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response content:", data.choices[0]?.message?.content);
  console.log("Usage:", data.usage);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
