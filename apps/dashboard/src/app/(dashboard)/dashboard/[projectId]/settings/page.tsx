import { auth } from "@/auth";
import { prisma } from "@aura/db";

export const dynamic = "force-dynamic";
import { redirect, notFound } from "next/navigation";
import SettingsClient from "@/components/dashboard/SettingsClient";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolvedParams = await params;
  
  const project = await prisma.project.findUnique({
    where: {
      id: resolvedParams.projectId,
      tenantId: session.user.id,
    },
  });

  if (!project) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <SettingsClient
      project={{
        id: project.id,
        name: project.name,
        budgetLimit: project.budgetLimit,
        budgetPeriod: project.budgetPeriod,
      }}
      user={{
        name: user?.name || session.user.name || "Unknown",
        email: user?.email || session.user.email || "",
        image: user?.image || session.user.image || "",
        plan: user?.plan || "FREE",
        hasPassword: Boolean(user?.password_hash),
      }}
    />
  );
}
