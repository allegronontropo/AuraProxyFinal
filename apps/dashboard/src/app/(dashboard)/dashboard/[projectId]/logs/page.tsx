import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRequestLogs } from "@/lib/queries";
import LogsTable from "@/components/dashboard/LogsTable";
import { Download } from "lucide-react";

export default async function RequestLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { projectId } = await params;
  
  // Next 15 awaits searchParams
  const resolvedSearchParams = await searchParams;

  const filters: import("@/lib/queries").LogFilter = {};
  if (resolvedSearchParams.model) filters.model = resolvedSearchParams.model as string;
  if (resolvedSearchParams.status === "200") filters.statusCode = "success";
  if (resolvedSearchParams.status === "error") filters.statusCode = "error";

  // We need to parse page from searchParams if pagination is supported
  const page = Number(resolvedSearchParams.page) || 1;

  const initialLogsData = await getRequestLogs(projectId, page, 50, filters);

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
          {/* Filter Form */}
          <form method="GET" className="flex flex-wrap gap-3 mb-6">
            <input 
              type="text" 
              name="model" 
              placeholder="Filter by model (e.g. gpt-4)" 
              defaultValue={(resolvedSearchParams.model as string) || ""} 
              className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 flex-1 min-w-[200px] max-w-xs"
            />
            <select 
              name="status" 
              defaultValue={(resolvedSearchParams.status as string) || ""} 
              className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none min-w-[140px]"
            >
              <option value="" className="bg-[#0d0d0f]">All Statuses</option>
              <option value="200" className="bg-[#0d0d0f]">Success (200)</option>
              <option value="error" className="bg-[#0d0d0f]">Errors</option>
            </select>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              Filter
            </button>
            {(resolvedSearchParams.model || resolvedSearchParams.status) && (
              <a href={`/dashboard/${projectId}/logs`} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm flex items-center transition-colors">
                Clear
              </a>
            )}
          </form>

          <LogsTable
            projectId={projectId}
            initialLogs={initialLogsData.logs}
            initialTotal={initialLogsData.total}
            initialPages={initialLogsData.pages}
          />
        </div>
      </main>
    </div>
  );
}
