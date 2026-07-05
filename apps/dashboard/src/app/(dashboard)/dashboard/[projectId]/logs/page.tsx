import { auth } from "@/auth";
import { redirect } from "next/navigation";
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
      <header
        className="shrink-0 flex items-center justify-between px-6 z-10"
        style={{
          height: "52px",
          background: "rgba(13,13,15,0.8)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-gray-200">Request Logs</h1>
          <div
            className="flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "#9ca3af",
            }}
          >
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
