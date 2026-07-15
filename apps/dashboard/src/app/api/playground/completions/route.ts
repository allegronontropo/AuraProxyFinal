import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@aura/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { keyId, provider, model, messages, temperature, maxTokens } = body;

    if (!keyId) {
      return NextResponse.json({ message: "Missing API Key ID" }, { status: 400 });
    }

    // Verify the key belongs to a project the user owns
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { project: true }
    });

    if (!apiKey || apiKey.project.tenantId !== session.user.id) {
      return NextResponse.json({ message: "Invalid API Key or unauthorized" }, { status: 403 });
    }

    const bypassSecret = process.env.INTERNAL_DASHBOARD_BYPASS_SECRET;
    if (!bypassSecret) {
      console.error("INTERNAL_DASHBOARD_BYPASS_SECRET is not configured.");
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    const proxyUrl = process.env.PROXY_URL || process.env.NEXT_PUBLIC_PROXY_URL;
    if (!proxyUrl) {
      console.error('PROXY_URL is not configured for dashboard playground forwarding.');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    // Normalize proxy URL by trimming trailing slashes to avoid parser issues
    let normalizedProxyUrl = proxyUrl;
    while (normalizedProxyUrl.endsWith("/")) {
      normalizedProxyUrl = normalizedProxyUrl.slice(0, -1);
    }
    const proxyEndpoint = `${normalizedProxyUrl}/v1/chat/completions`;

    // Forward the request to the Aura Proxy
    const proxyRes = await fetch(proxyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bypassSecret}`,
        "x-dashboard-api-key-id": apiKey.id,
        "x-provider": provider || "openai",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false, // Keep streaming false for MVP stability
      }),
    });

    const proxyData = await proxyRes.json();

    if (!proxyRes.ok) {
      return NextResponse.json(proxyData, { status: proxyRes.status });
    }

    return NextResponse.json(proxyData);

  } catch (error: unknown) {
    console.error("Playground API Error:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
