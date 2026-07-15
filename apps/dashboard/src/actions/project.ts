"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redis } from "@aura/redis";
import { REDIS_KEYS } from "@aura/shared";

// ─── Create Project (Workspace) ───────────────────────────────────────────────

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const name = formData.get("name") as string;
  const budgetLimit = parseFloat(formData.get("budgetLimit") as string) || 100;
  const budgetPeriod = (formData.get("budgetPeriod") as string) || "MONTHLY";

  if (!name || name.trim().length < 2) {
    return { error: "Workspace name must be at least 2 characters." };
  }

  try {
    // Create raw API key
    const rawKey = `sk_aura_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12);

    const project = await prisma.project.create({
      data: {
        tenantId: session.user.id,
        name: name.trim(),
        budgetLimit,
        budgetPeriod: budgetPeriod as "DAILY" | "WEEKLY" | "MONTHLY",
        apiKeys: {
          create: {
            keyHash,
            keyPrefix,
            name: "Default Key",
            permissions: ["chat:write", "models:read"],
          },
        },
      },
    });

    revalidatePath("/workspace");
    // Return raw key once - never stored again
    return { success: true, projectId: project.id, apiKey: rawKey };
  } catch (error) {
    console.error("createProject error:", error);
    return { error: "Failed to create workspace." };
  }
}

// ─── Update Project ───────────────────────────────────────────────────────────

export async function updateProject(
  projectId: string,
  data: { name?: string; budgetLimit?: number; budgetPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' }
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
  });
  if (!project) return { error: "Project not found." };

  // Validate
  if (data.name !== undefined && data.name.trim().length < 1) {
    return { error: "Project name cannot be empty." };
  }
  if (data.budgetLimit !== undefined && data.budgetLimit < 0) {
    return { error: "Budget limit must be a positive number." };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.budgetLimit !== undefined && { budgetLimit: data.budgetLimit }),
        ...(data.budgetPeriod && { budgetPeriod: data.budgetPeriod }),
      },
    });

    // Invalidate API key cache in Redis so that the proxy picks up the new budget limit immediately
    try {
      const apiKeys = await prisma.apiKey.findMany({ where: { projectId } });
      for (const key of apiKeys) {
        await redis.del(REDIS_KEYS.apiKeyCache(key.keyHash));
        await redis.del(REDIS_KEYS.apiKeyCache(`id:${key.id}`));
      }
    } catch (redisError) {
      console.error("Failed to invalidate Redis cache:", redisError);
    }

    revalidatePath(`/dashboard/${projectId}`);
    revalidatePath(`/dashboard/${projectId}/settings`);
    revalidatePath(`/admin/projects`);
    return { success: true };
  } catch (error) {
    console.error("updateProject error:", error);
    return { error: "Failed to update workspace." };
  }
}

// ─── Delete Project ───────────────────────────────────────────────────────────

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
  });
  if (!project) return { error: "Project not found." };

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
    revalidatePath("/workspace");
    redirect("/workspace");
  } catch (error) {
    console.error("deleteProject error:", error);
    return { error: "Failed to delete workspace." };
  }
}
