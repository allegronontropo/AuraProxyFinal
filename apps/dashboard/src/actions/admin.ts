"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

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
  } catch (error: any) {
    console.error("Failed to toggle user suspension:", error);
    return { error: error.message || "An error occurred." };
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
  } catch (error: any) {
    console.error("Failed to toggle project suspension:", error);
    return { error: error.message || "An error occurred." };
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
  } catch (error: any) {
    console.error("Failed to override project budget:", error);
    return { error: error.message || "An error occurred." };
  }
}
