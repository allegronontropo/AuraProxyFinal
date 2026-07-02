import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const secret = process.env.INTERNAL_DASHBOARD_BYPASS_SECRET || "playground_bypass_secret_local";

async function main() {
  const apiKey = await prisma.apiKey.findFirst();
  if (!apiKey) throw new Error("No API keys found");

  const body = {
    model: "gemini-2.5-flash",
    messages: [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: "what is vercel please explain" }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: false,
  };

  console.log("Sending FIRST request...");
  let res = await fetch("http://localhost:3000/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secret}`,
      "x-dashboard-api-key-id": apiKey.id,
      "x-provider": "google",
    },
    body: JSON.stringify(body),
  });
  let data = await res.json();
  console.log("First Request Cached:", data.cached);

  await new Promise(r => setTimeout(r, 2000));
  
  console.log("\nSending SECOND request (Exact Match)...");
  res = await fetch("http://localhost:3000/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secret}`,
      "x-dashboard-api-key-id": apiKey.id,
      "x-provider": "google",
    },
    body: JSON.stringify(body),
  });
  data = await res.json();
  console.log("Second Request Cached:", data.cached);

  await new Promise(r => setTimeout(r, 2000));
  
  console.log("\nSending THIRD request (Semantic Match)...");
  body.messages[1].content = "can you explain what vercel is";
  res = await fetch("http://localhost:3000/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secret}`,
      "x-dashboard-api-key-id": apiKey.id,
      "x-provider": "google",
    },
    body: JSON.stringify(body),
  });
  data = await res.json();
  console.log("Third Request Cached:", data.cached);

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
