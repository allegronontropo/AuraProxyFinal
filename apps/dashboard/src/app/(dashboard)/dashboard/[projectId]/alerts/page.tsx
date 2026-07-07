import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { getProjectAlerts } from "@/actions/alerts";
import AlertQueueClient, { type Alert } from "@/components/dashboard/AlertQueueClient";

function asMetadataRecord(metadata: unknown): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  return metadata as Record<string, unknown>;
}

function getProviderFromMetadata(metadata: Record<string, unknown> | undefined) {
  const provider = metadata?.primary_provider || metadata?.fallback_provider;

  return typeof provider === "string" ? provider : undefined;
}

export default async function AlertQueuePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { projectId } = await params;

  const alerts = await getProjectAlerts(projectId);

  const formattedAlerts: Alert[] = alerts.map((a) => {
    const metadata = asMetadataRecord(a.metadata);

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      severity: a.severity,
      status: a.status,
      source: a.source,
      metadata,
      timestamp: a.createdAt.toISOString(),
      provider: getProviderFromMetadata(metadata),
    };
  });

  return <AlertQueueClient initialAlerts={formattedAlerts} />;
}
