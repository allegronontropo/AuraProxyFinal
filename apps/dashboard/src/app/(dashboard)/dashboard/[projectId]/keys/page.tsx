import { auth } from "@/auth";
import { getApiKeys } from "@/lib/queries";

export const dynamic = "force-dynamic";
import { getProviderCredentials } from "@/actions/credentials";
import ApiKeysTable from "@/components/dashboard/ApiKeysTable";
import ProviderCredentialsSection from "@/components/dashboard/ProviderCredentialsSection";
import { redirect } from "next/navigation";

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const { projectId } = resolvedParams;

  const [keys, credResult] = await Promise.all([
    getApiKeys(projectId),
    getProviderCredentials(projectId),
  ]);

  const credentials = "credentials" in (credResult ?? {}) ? credResult.credentials : [];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top bar */}
      <div className="h-[52px] shrink-0 bg-[#0d0d0f]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 z-10">
        <h1 className="text-[15px] font-medium text-white tracking-wide">API Keys & Credentials</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Aura API Keys section */}
        <ApiKeysTable projectId={projectId} initialKeys={keys} />

        {/* Provider Credentials section */}
        <div className="px-6 pb-8 max-w-[900px] mx-auto">
          <ProviderCredentialsSection
            projectId={projectId}
            initialCredentials={credentials ?? []}
          />
        </div>
      </div>
    </div>
  );
}

