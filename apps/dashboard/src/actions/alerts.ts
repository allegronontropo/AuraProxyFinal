"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { AlertStatus } from "@aura/shared";

export async function getProjectAlerts(projectId: string) {
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

  const alerts = await prisma.alert.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return alerts;
}

export async function updateAlertStatus(alertId: string, status: AlertStatus) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify the alert belongs to a project owned by the user
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: { project: true },
  });

  if (!alert || alert.project.tenantId !== session.user.id) {
    throw new Error("Alert not found or unauthorized");
  }

  const updatedAlert = await prisma.alert.update({
    where: { id: alertId },
    data: { status },
  });

  return updatedAlert;
}
