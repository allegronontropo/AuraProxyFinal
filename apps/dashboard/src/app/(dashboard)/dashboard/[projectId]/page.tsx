import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { 
  getProjectStats, 
  getProviderBreakdown, 
  getRecentLogs, 
  getBudgetStatus, 
  getModelBreakdown
} from "@/lib/queries";

import MetricsStrip from "@/components/dashboard/MetricsStrip";
import UsageChart from "@/components/dashboard/UsageChart";
import ProviderBreakdown from "@/components/dashboard/ProviderBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { CostBreakdown } from "@/components/dashboard/CostBreakdown";
import { AlertTriangle } from "lucide-react";

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { projectId } = await params;

  const [
    stats,
    providerBreakdown,
    recentLogs,
    budgetStatus,
    modelBreakdown
  ] = await Promise.all([
    getProjectStats(projectId),
    getProviderBreakdown(projectId),
    getRecentLogs(projectId, 15),
    getBudgetStatus(projectId),
    getModelBreakdown(projectId)
  ]);

  const safeBudgetStatus = budgetStatus || {
    used: 0,
    limit: 100,
    remaining: 100,
    period: "MONTHLY",
    percentage: 0,
    exceeded: false,
  };

  const showBudgetWarning = safeBudgetStatus.percentage > 80;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Bar */}
      <div className="h-[52px] shrink-0 bg-[rgba(13,13,15,0.8)] backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between px-6 z-10 relative">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-100">Overview</h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Live</span>
          </div>
        </div>
        
        {showBudgetWarning && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Budget at {safeBudgetStatus.percentage.toFixed(0)}%
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto z-10 relative">
        <div className="p-[22px] md:p-6 max-w-[1400px] mx-auto space-y-5">
          
          <MetricsStrip {...stats} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <UsageChart timeSeries={stats.usageTimeSeries} />
            </div>
            <div className="lg:col-span-2">
              <ProviderBreakdown providers={providerBreakdown} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <RecentActivity logs={recentLogs} />
            </div>
            <div className="lg:col-span-2">
              <CostBreakdown 
                budgetStatus={safeBudgetStatus} 
                modelBreakdown={modelBreakdown} 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
