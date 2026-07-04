"use server";

import prisma from "@aura/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getFallbackLogs(projectId: string, limit = 10) {
  const session = await getServerSession(authOptions);
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
