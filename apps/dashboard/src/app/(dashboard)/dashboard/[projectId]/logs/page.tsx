import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { getRequestLogs, getProjectApiKeys } from "@/lib/queries";
import LogsTable from "@/components/dashboard/LogsTable";
import { Download } from "lucide-react";

export default async function RequestLogsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { projectId } = await params;
  
  const [initialLogsData, apiKeys] = await Promise.all([
    getRequestLogs(projectId, 1, 50, {}),
    getProjectApiKeys(projectId)
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* TopBar */}
      <header className="h-[52px] shrink-0 bg-[#0D0D0F]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-medium text-white/90 tracking-wide">Request Logs</h1>
          <div className="text-xs font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/[0.05]">
            {initialLogsData.total.toLocaleString()}
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <LogsTable
            projectId={projectId}
            initialLogs={initialLogsData.logs}
            initialTotal={initialLogsData.total}
            initialPages={initialLogsData.pages}
            apiKeys={apiKeys}
          />
        </div>
      </main>
    </div>
  );
}
