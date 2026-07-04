"use server";

import prisma from "@aura/db";
import { auth } from "@/auth";

export async function getFallbackLogs(projectId: string, limit = 10) {
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

  const logs = await prisma.requestLog.findMany({
    where: {
      projectId,
      metadata: {
        path: ["fallback_provider"],
        not: null,
      },
    },
    include: {
      apiKey: {
        select: { name: true, keyPrefix: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs;
}
