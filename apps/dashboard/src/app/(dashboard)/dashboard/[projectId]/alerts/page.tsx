import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProjectAlerts } from "@/actions/alerts";
import AlertQueueClient, { type Alert } from "@/components/dashboard/AlertQueueClient";

export default async function AlertQueuePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { projectId } = await params;

  const alerts = await getProjectAlerts(projectId);

  // Note: we can map or adapt the Prisma Alert to match the client exactly, but they should be compatible.
  const formattedAlerts = alerts.map((a) => ({
    ...a,
    timestamp: a.createdAt.toISOString(),
    provider: a.metadata?.primary_provider || a.metadata?.fallback_provider || null,
  }));

  return <AlertQueueClient initialAlerts={formattedAlerts as Alert[]} />;
}
