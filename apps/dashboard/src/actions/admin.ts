"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { AlertStatus } from "@aura/shared";
import { redis } from "@aura/redis";
import { REDIS_KEYS } from "@aura/shared";

async function invalidateProjectApiKeys(projectIds: string[]) {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true, keyHash: true },
    });
    for (const key of apiKeys) {
      const hashKey = REDIS_KEYS.apiKeyCache(key.keyHash);
      const idKey = REDIS_KEYS.apiKeyCache(`id:${key.id}`);
      await redis.del(hashKey, idKey);
      await redis.publish('cache:invalidate:apikey', hashKey);
      await redis.publish('cache:invalidate:apikey', idKey);
    }
  } catch (err) {
    console.error("Failed to invalidate api keys cache:", err);
  }
}

async function invalidateUserApiKeys(userIds: string[]) {
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId: { in: userIds } },
      select: { id: true },
    });
    await invalidateProjectApiKeys(projects.map(p => p.id));
  } catch (err) {
    console.error("Failed to invalidate user api keys cache:", err);
  }
}

async function invalidateAllApiKeys() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      select: { id: true, keyHash: true },
    });
    for (const key of apiKeys) {
      const hashKey = REDIS_KEYS.apiKeyCache(key.keyHash);
      const idKey = REDIS_KEYS.apiKeyCache(`id:${key.id}`);
      await redis.del(hashKey, idKey);
      await redis.publish('cache:invalidate:apikey', hashKey);
      await redis.publish('cache:invalidate:apikey', idKey);
    }
  } catch (err) {
    console.error("Failed to invalidate all api keys cache:", err);
  }
}

async function invalidateApiKeysByIds(keyIds: string[]) {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { id: { in: keyIds } },
      select: { id: true, keyHash: true },
    });
    for (const key of apiKeys) {
      const hashKey = REDIS_KEYS.apiKeyCache(key.keyHash);
      const idKey = REDIS_KEYS.apiKeyCache(`id:${key.id}`);
      await redis.del(hashKey, idKey);
      await redis.publish('cache:invalidate:apikey', hashKey);
      await redis.publish('cache:invalidate:apikey', idKey);
    }
  } catch (err) {
    console.error("Failed to invalidate api keys by ids cache:", err);
  }
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required.");
  }
}

export async function toggleUserSuspension(userId: string, isActive: boolean) {
  try {
    await requireAdmin();
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    await invalidateUserApiKeys([userId]);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle user suspension:", error);
    return { error: error instanceof Error ? error.message : "An error occurred." };
  }
}

export async function toggleProjectSuspension(projectId: string, isActive: boolean) {
  try {
    await requireAdmin();
    await prisma.project.update({
      where: { id: projectId },
      data: { isActive },
    });
    await invalidateProjectApiKeys([projectId]);
    revalidatePath("/admin/projects");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle project suspension:", error);
    return { error: error instanceof Error ? error.message : "An error occurred." };
  }
}

export async function overrideProjectBudget(projectId: string, newLimit: number) {
  try {
    await requireAdmin();
    await prisma.project.update({
      where: { id: projectId },
      data: { budgetLimit: newLimit },
    });
    await invalidateProjectApiKeys([projectId]);
    revalidatePath("/admin/projects");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to override project budget:", error);
    return { error: error instanceof Error ? error.message : "An error occurred." };
  }
}

export async function getAllAlerts(filters?: {
  severity?: string;
  status?: string;
  sortBy?:  string;
  sortDir?: "asc" | "desc";
  skip?: number;
  take?: number;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const where: import("@prisma/client").Prisma.AlertWhereInput = {};
  if (filters?.severity && filters.severity !== "all") {
    where.severity = filters.severity as import("@aura/shared").AlertSeverity;
  }
  if (filters?.status && filters.status !== "all") {
    where.status = filters.status as AlertStatus;
  }

  const ORDER_MAP: Record<string, import("@prisma/client").Prisma.AlertOrderByWithRelationInput> = {
    createdAt: { createdAt: filters?.sortDir ?? "desc" },
    severity:  { severity:  filters?.sortDir ?? "desc" },
    status:    { status:    filters?.sortDir ?? "desc" },
  };
  const orderBy = ORDER_MAP[filters?.sortBy ?? "createdAt"] ?? { createdAt: "desc" };

  return prisma.alert.findMany({
    where,
    orderBy,
    skip:  filters?.skip  ?? 0,
    take:  filters?.take  ?? 500,
    include: {
      project: { select: { name: true, tenant: { select: { email: true } } } },
    },
  });
}

export async function updateAdminAlertStatus(alertId: string, status: AlertStatus) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    await prisma.alert.update({
      where: { id: alertId },
      data: { status },
    });
    revalidatePath("/admin/alerts");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update alert:", error);
    return { error: error instanceof Error ? error.message : "Failed to update alert" };
  }
}

export async function bulkUpdateAdminAlertStatus(alertIds: string[], status: AlertStatus) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    const result = await prisma.alert.updateMany({
      where: { id: { in: alertIds } },
      data: { status },
    });
    revalidatePath("/admin/alerts");
    return { success: true, count: result.count };
  } catch (error: unknown) {
    console.error("Failed to bulk update alerts:", error);
    return { error: error instanceof Error ? error.message : "Failed to bulk update alerts" };
  }
}


export async function setAllProjectBudgets(limitUsd: number) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.project.updateMany({ data: { budgetLimit: limitUsd } });
  await invalidateAllApiKeys();
  revalidatePath("/admin/projects");
  return { success: true };
}

export async function setAllApiKeyRateLimits(rpm: number) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.apiKey.updateMany({ data: { rateLimit: rpm } });
  await invalidateAllApiKeys();
  revalidatePath("/admin/api-keys");
  return { success: true };
}

export async function bulkSetApiKeyRateLimits(keyIds: string[], rpm: number) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    const result = await prisma.apiKey.updateMany({
      where: { id: { in: keyIds } },
      data: { rateLimit: rpm },
    });
    await invalidateApiKeysByIds(keyIds);
    revalidatePath("/admin/api-keys");
    return { success: true, count: result.count };
  } catch (error: unknown) {
    console.error("Failed to bulk update rate limits:", error);
    return { error: error instanceof Error ? error.message : "An error occurred." };
  }
}

// ─── Bulk by-ID actions (for table checkbox selections) ───────────────────────

export async function bulkToggleUserSuspension(userIds: string[], isActive: boolean) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { isActive },
  });
  await invalidateUserApiKeys(userIds);
  revalidatePath("/admin/users");
  return { success: true, count: userIds.length };
}

export async function toggleUserSendAlerts(userId: string, sendAlerts: boolean) {
  try {
    await requireAdmin();
    await prisma.user.update({
      where: { id: userId },
      data: { sendAlerts },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle user sendAlerts:", error);
    return { error: error instanceof Error ? error.message : "An error occurred." };
  }
}

export async function bulkToggleProjectSuspension(projectIds: string[], isActive: boolean) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.project.updateMany({
    where: { id: { in: projectIds } },
    data: { isActive },
  });
  await invalidateProjectApiKeys(projectIds);
  revalidatePath("/admin/projects");
  return { success: true, count: projectIds.length };
}

export async function bulkSetSelectedProjectBudgets(projectIds: string[], limitUsd: number) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.project.updateMany({
    where: { id: { in: projectIds } },
    data: { budgetLimit: limitUsd },
  });
  await invalidateProjectApiKeys(projectIds);
  revalidatePath("/admin/projects");
  return { success: true, count: projectIds.length };
}

