"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { AlertStatus } from "@aura/shared";

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
      data: { status, resolvedAt: status === "resolved" ? new Date() : null },
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
      data: { status, resolvedAt: status === "resolved" ? new Date() : null },
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
  revalidatePath("/admin/projects");
  return { success: true };
}

export async function setAllApiKeyRateLimits(rpm: number) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.apiKey.updateMany({ data: { rateLimit: rpm } });
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
  revalidatePath("/admin/users");
  return { success: true, count: userIds.length };
}

export async function bulkToggleProjectSuspension(projectIds: string[], isActive: boolean) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.project.updateMany({
    where: { id: { in: projectIds } },
    data: { isActive },
  });
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
  revalidatePath("/admin/projects");
  return { success: true, count: projectIds.length };
}

