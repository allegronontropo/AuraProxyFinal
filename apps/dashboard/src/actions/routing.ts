"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function getProjectRouting(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
    select: { fallbackModels: true },
  });

  if (!project) return { error: "Project not found." };
  return { fallbackModels: project.fallbackModels };
}

export async function saveProjectRouting(projectId: string, fallbackModels: string[]) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
  });

  if (!project) return { error: "Project not found or unauthorized." };

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { fallbackModels },
    });

    revalidatePath(`/dashboard/${projectId}/routing`);
    return { success: true };
  } catch (err) {
    console.error("saveProjectRouting error:", err);
    return { error: "Failed to save routing configuration." };
  }
}
