import { auth } from "@/auth";
import { prisma } from "@aura/db";
import { redirect, notFound } from "next/navigation";
import PlaygroundClient from "@/components/dashboard/PlaygroundClient";

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolvedParams = await params;

  const project = await prisma.project.findFirst({
    where: {
      id: resolvedParams.projectId,
      tenantId: session.user.id,
    },
  });

  if (!project) notFound();

  const apiKeys = await prisma.apiKey.findMany({
    where: {
      projectId: resolvedParams.projectId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return (
    <PlaygroundClient 
      projectId={project.id} 
      projectName={project.name}
      availableKeys={apiKeys}
    />
  );
}
