"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";

export async function getFallbackLogs(
  projectId: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "latencyMs" | "statusCode";
    sortOrder?: "asc" | "desc";
    apiKeyId?: string;
  } = {}
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
  });

  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    projectId,
    metadata: {
      path: ["fallback_provider"],
      // @ts-expect-error - Prisma typing for JSON filters sometimes misbehaves
      not: null,
    },
  };

  if (params.apiKeyId && params.apiKeyId !== "all") {
    where.apiKeyId = params.apiKeyId;
  }

  const [logs, total] = await Promise.all([
    prisma.requestLog.findMany({
      where,
      include: {
        apiKey: {
          select: { name: true, keyPrefix: true },
        },
      },
      orderBy: { [params.sortBy || "createdAt"]: params.sortOrder || "desc" },
      skip,
      take: limit,
    }),
    prisma.requestLog.count({ where }),
  ]);

  return { logs, total, pages: Math.ceil(total / limit) };
}
