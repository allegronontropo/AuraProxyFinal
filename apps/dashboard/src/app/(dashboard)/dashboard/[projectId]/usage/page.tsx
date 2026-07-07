import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsageByModel } from "@/lib/queries";
import UsageClient from "@/components/dashboard/UsageClient";

export default async function UsagePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { projectId } = await params;
  const { from, to } = await searchParams;

  // Parse dates or default to last 30 days
  const toDate = to ? new Date(to) : new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - thirtyDaysMs);

  // Fetch the usage data for the specified date range
  const usageData = await getUsageByModel(projectId, fromDate, toDate);

  return <UsageClient usageData={usageData} from={fromDate} to={toDate} />;
}
