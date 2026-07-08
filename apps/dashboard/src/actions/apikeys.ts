"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

// ─── Generate API Key ─────────────────────────────────────────────────────────

export async function generateApiKey(
  projectId: string,
  name: string,
  permissions: string[] = ["chat:write", "models:read"],
  rateLimit = 60
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
  });
  if (!project) return { error: "Workspace not found." };

  try {
    const rawKey = `sk_aura_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12);

    await prisma.apiKey.create({
      data: {
        projectId,
        keyHash,
        keyPrefix,
        name: name.trim() || "New Key",
        permissions,
        rateLimit,
      },
    });

    revalidatePath(`/dashboard/${projectId}/keys`);
    // Return raw key once - it is never stored in plaintext
    return { success: true, apiKey: rawKey, keyPrefix };
  } catch (error) {
    console.error("generateApiKey error:", error);
    return { error: "Failed to generate API key." };
  }
}

// ─── Revoke API Key ───────────────────────────────────────────────────────────

export async function revokeApiKey(keyId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    // Verify ownership
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        project: { tenantId: session.user.id },
      },
    });
    if (!key) return { error: "Key not found." };

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    revalidatePath(`/dashboard/${projectId}/keys`);
    return { success: true };
  } catch (error) {
    console.error("revokeApiKey error:", error);
    return { error: "Failed to revoke API key." };
  }
}

// ─── Rotate API Key ───────────────────────────────────────────────────────────

export async function rotateApiKey(keyId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    const oldKey = await prisma.apiKey.findFirst({
      where: { id: keyId, project: { tenantId: session.user.id } },
    });
    if (!oldKey) return { error: "Key not found." };

    // Generate new key
    const rawKey = `sk_aura_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12);

    // Deactivate old, create new in transaction
    await prisma.$transaction([
      prisma.apiKey.update({ where: { id: keyId }, data: { isActive: false } }),
      prisma.apiKey.create({
        data: {
          projectId,
          keyHash,
          keyPrefix,
          name: `${oldKey.name} (rotated)`,
          permissions: oldKey.permissions,
          rateLimit: oldKey.rateLimit,
        },
      }),
    ]);

    revalidatePath(`/dashboard/${projectId}/keys`);
    return { success: true, apiKey: rawKey, keyPrefix };
  } catch (error) {
    console.error("rotateApiKey error:", error);
    return { error: "Failed to rotate API key." };
  }
}

// ─── Delete API Key ───────────────────────────────────────────────────────────

export async function deleteApiKey(keyId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, project: { tenantId: session.user.id } },
    });
    if (!key) return { error: "Key not found." };

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    revalidatePath(`/dashboard/${projectId}/keys`);
    return { success: true };
  } catch (error) {
    console.error("deleteApiKey error:", error);
    return { error: "Failed to delete API key." };
  }
}
