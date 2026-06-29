import { auth } from "@/auth";
import { getApiKeys } from "@/lib/queries";
import ApiKeysTable from "@/components/dashboard/ApiKeysTable";
import { redirect } from "next/navigation";

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const keys = await getApiKeys(resolvedParams.projectId);

  return (
    <ApiKeysTable projectId={resolvedParams.projectId} initialKeys={keys} />
  );
}
