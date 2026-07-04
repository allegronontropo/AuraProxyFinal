"use server";

import { prisma } from "@aura/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ─── Encryption helpers (dashboard uses same AES-256-GCM scheme) ─────────────

import crypto from "crypto";

function getEncryptionKey(): Buffer {
  const hex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY is not configured.");
  }
  return Buffer.from(hex, "hex");
}

function encryptKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

// ─── List Provider Credentials ────────────────────────────────────────────────

export async function getProviderCredentials(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
  });
  if (!project) return { error: "Project not found." };

  const credentials = await prisma.providerCredential.findMany({
    where: { projectId },
    select: {
      id: true,
      provider: true,
      label: true,
      isActive: true,
      createdAt: true,
      // Never return the encrypted apiKey to the client
    },
    orderBy: { createdAt: "desc" },
  });

  return { credentials };
}

// ─── Save Provider Credential (create or replace) ─────────────────────────────

export async function saveProviderCredential(
  projectId: string,
  provider: string,
  apiKey: string,
  label?: string
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: session.user.id },
  });
  if (!project) return { error: "Project not found." };

  // Validate provider
  const validProviders = ["openai", "anthropic", "google", "mistral", "groq"];
  if (!validProviders.includes(provider.toLowerCase())) {
    return { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` };
  }

  // Validate API key format (basic check — just ensure it's non-empty)
  if (!apiKey || apiKey.trim().length < 8) {
    return { error: "API key must be at least 8 characters." };
  }

  try {
    const encryptedKey = encryptKey(apiKey.trim());

    await prisma.providerCredential.upsert({
      where: {
        projectId_provider: { projectId, provider: provider.toLowerCase() },
      },
      update: {
        apiKey: encryptedKey,
        label: label?.trim() || provider,
        isActive: true,
      },
      create: {
        projectId,
        provider: provider.toLowerCase(),
        apiKey: encryptedKey,
        label: label?.trim() || provider,
      },
    });

    revalidatePath(`/dashboard/${projectId}/keys`);
    return { success: true };
  } catch (err: unknown) {
    console.error("saveProviderCredential error:", err);
    return { error: `Failed to save provider credential: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── Delete Provider Credential ───────────────────────────────────────────────

export async function deleteProviderCredential(credentialId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    // Verify ownership via join
    const credential = await prisma.providerCredential.findFirst({
      where: {
        id: credentialId,
        project: { tenantId: session.user.id },
      },
    });
    if (!credential) return { error: "Credential not found." };

    await prisma.providerCredential.delete({ where: { id: credentialId } });

    revalidatePath(`/dashboard/${projectId}/keys`);
    return { success: true };
  } catch (err) {
    console.error("deleteProviderCredential error:", err);
    return { error: "Failed to delete credential." };
  }
}
