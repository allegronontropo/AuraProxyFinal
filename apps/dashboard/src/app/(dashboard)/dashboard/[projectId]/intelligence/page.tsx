import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getGatewayStatus,
  getGatewayProviderLeaderboard,
  getGatewayTopModels,
} from "@/lib/queries";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  Gauge,
  HardDrive,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { ProviderIcon } from "@/components/ui/provider-icon";

function ProviderChip({ provider }: { provider: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    openai: { bg: "bg-emerald-500/15", color: "text-emerald-500" },
    anthropic: { bg: "bg-amber-500/15", color: "text-amber-500" },
    google: { bg: "bg-blue-500/15", color: "text-blue-500" },
    groq: { bg: "bg-violet-500/15", color: "text-violet-500" },
    azure: { bg: "bg-sky-500/15", color: "text-sky-500" },
    cohere: { bg: "bg-teal-500/15", color: "text-teal-500" },
  };
  const cfg = map[provider.toLowerCase()] ?? { bg: "bg-white/10", color: "text-gray-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.color} text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize`}>
      <ProviderIcon provider={provider} size={12} type="color" />
      {provider}
    </span>
  );
}

function formatMoney(value: number) {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function formatMs(value: number) {
  return `${Math.round(value)}ms`;
}

function formatDuration(ms: number) {
  if (ms >= 3_600_000) return `${(ms / 3_600_000).toFixed(1)}h`;
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return formatMs(ms);
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function statusColor(value: number) {
  if (value >= 95) return "#22c55e";
  if (value >= 85) return "#f59e0b";
  return "#ef4444";
}

function RadialProgress({ percentage, color }: { percentage: number; color: string }) {
  const size = 116;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[24px] font-semibold text-white leading-none">{safePercentage.toFixed(1)}%</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">Success</span>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color = "text-white",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[11px] border border-white/[0.08] bg-white/[0.015] px-5 py-4 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-white/[0.12]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-500">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
        </div>
      </div>
      <div className={`mt-3 text-[26px] font-bold leading-tight tracking-tight ${color}`}>{value}</div>
      <div className="mt-1 text-[11px] font-medium text-gray-500">{sub}</div>
    </div>
  );
}

function ImpactMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-[9px] border border-white/[0.06] bg-white/[0.02] p-4">
      <div className={`mb-2 flex items-center gap-2 text-[12px] font-medium ${tone}`}>
        {icon}
        {label}
      </div>
      <div className="text-[22px] font-bold leading-tight text-white">{value}</div>
    </div>
  );
}

export default async function GatewayInsightsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { projectId } = await params;

  const [status, leaderboard, topModels] = await Promise.all([
    getGatewayStatus(projectId),
    getGatewayProviderLeaderboard(projectId),
    getGatewayTopModels(projectId),
  ]);

  const isEmpty = status.totalRequests === 0;
  const successColor = statusColor(status.successRate);
  const cacheColor =
    status.cacheHitRate >= 50 ? "text-emerald-400" : status.cacheHitRate >= 25 ? "text-amber-400" : "text-red-400";
  const fastestLatency = Math.max(leaderboard[0]?.avgLatencyMs ?? 1, 1);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="h-[52px] shrink-0 bg-[rgba(13,13,15,0.8)] backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between px-6 z-10 relative">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-gray-400" />
          <h1 className="text-base font-semibold text-gray-100">Gateway Insights</h1>
          {!isEmpty && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto z-10 relative">
        <div className="p-[22px] md:p-6 max-w-[1400px] mx-auto space-y-5">
          {isEmpty ? (
            <div className="flex h-[300px] items-center justify-center rounded-[11px] border border-dashed border-white/10 bg-white/[0.015] text-sm text-gray-500">
              No request data available yet. Make an API request to see gateway insights.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  icon={<Activity className="h-3.5 w-3.5" />}
                  label="Total Requests"
                  value={formatCompact(status.totalRequests)}
                  sub="All routed traffic"
                />
                <KpiCard
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  label="Success Rate"
                  value={`${status.successRate.toFixed(1)}%`}
                  sub="Non-error gateway responses"
                  color={status.successRate >= 95 ? "text-emerald-400" : status.successRate >= 85 ? "text-amber-400" : "text-red-400"}
                />
                <KpiCard
                  icon={<Gauge className="h-3.5 w-3.5" />}
                  label="Avg Latency"
                  value={formatMs(status.avgLatencyMs)}
                  sub="Across all providers"
                  color={status.avgLatencyMs < 200 ? "text-emerald-400" : status.avgLatencyMs < 500 ? "text-amber-400" : "text-red-400"}
                />
                <KpiCard
                  icon={<Database className="h-3.5 w-3.5" />}
                  label="Cache Hit Rate"
                  value={`${status.cacheHitRate.toFixed(1)}%`}
                  sub={`${status.cacheHits.toLocaleString()} cache hits`}
                  color={cacheColor}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.9fr]">
                <div className="group relative overflow-hidden rounded-[11px] border border-white/[0.08] bg-white/[0.015] p-6 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-white/[0.12]">
                  <div
                    className="absolute -right-20 -top-24 h-[260px] w-[260px] rounded-full blur-[80px] opacity-[0.12] transition-opacity duration-500 group-hover:opacity-[0.18]"
                    style={{ background: successColor }}
                  />
                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-[620px]">
                      <div className="mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                          Gateway Health
                        </span>
                      </div>
                      <h2 className="text-[20px] font-semibold leading-snug text-white">
                        Routing requests with high reliability.
                      </h2>
                      <p className="mt-2 max-w-[58ch] text-[13px] leading-6 text-gray-500">
                        Success rate, latency, and cache impact are computed from the proxy request log so this page reflects how the gateway is actually running.
                      </p>
                    </div>
                    <RadialProgress percentage={status.successRate} color={successColor} />
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-[11px] border border-white/[0.08] bg-white/[0.015] p-6 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-white/[0.12]">
                  <div className="absolute -bottom-20 -right-20 h-[240px] w-[240px] rounded-full bg-violet-500 blur-[80px] opacity-[0.12] transition-opacity duration-500 group-hover:opacity-[0.18]" />
                  <div className="relative z-10 mb-5 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-violet-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Cache Impact</span>
                  </div>
                  <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ImpactMetric
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                      label="Money Saved"
                      value={formatMoney(status.costSavedUsd)}
                      tone="text-emerald-400"
                    />
                    <ImpactMetric
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="Time Saved"
                      value={formatDuration(status.timeSavedMs)}
                      tone="text-sky-400"
                    />
                    <ImpactMetric
                      icon={<Database className="h-3.5 w-3.5" />}
                      label="Cache Hits"
                      value={status.cacheHits.toLocaleString()}
                      tone="text-violet-400"
                    />
                    <ImpactMetric
                      icon={<HardDrive className="h-3.5 w-3.5" />}
                      label="Bandwidth Saved"
                      value={formatBytes(status.estimatedBandwidthSavedBytes)}
                      tone="text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.4fr]">
                <div className="group relative overflow-hidden rounded-[11px] border border-white/[0.08] bg-white/[0.015] p-6 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-white/[0.12]">
                  <div className="relative z-10 mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Speed Leaderboard
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">Lower latency is better</span>
                  </div>

                  <div className="relative z-10 flex flex-col gap-4">
                    {leaderboard.map((provider, index) => {
                      const scorePct = Math.min(100, Math.max(8, (fastestLatency / Math.max(provider.avgLatencyMs, 1)) * 100));
                      const isFastest = index === 0;

                      return (
                        <div key={provider.provider} className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-xs font-bold ${isFastest ? "text-amber-400" : "text-gray-500"}`}>
                                #{index + 1}
                              </span>
                              <ProviderIcon provider={provider.provider} size={12} type="color" />
                              <span className="truncate text-[13px] font-semibold capitalize text-gray-100">
                                {provider.provider}
                              </span>
                            </div>
                            <span className={`text-[13px] font-bold ${isFastest ? "text-white" : "text-gray-300"}`}>
                              {formatMs(provider.avgLatencyMs)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-reduce:transition-none ${
                                isFastest ? "bg-amber-400" : "bg-white/20"
                              }`}
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                          {provider.successRate < 95 && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                              Error rate: {(100 - provider.successRate).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {leaderboard.length === 0 && <span className="text-[13px] text-gray-500">No provider data.</span>}
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-[11px] border border-white/[0.08] bg-white/[0.015] p-6 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-white/[0.12]">
                  <div className="relative z-10 mb-5 flex items-center gap-2">
                    <Target className="h-4 w-4 text-violet-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Top Models (7 Days)</span>
                  </div>

                  <div className="relative z-10 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Model</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Provider</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Requests</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Success</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topModels.map((row, index) => (
                          <tr key={`${row.provider}-${row.model}`} className={index === topModels.length - 1 ? "" : "border-b border-white/[0.03]"}>
                            <td className="px-4 py-4 text-[13px] font-semibold text-gray-100">{row.model}</td>
                            <td className="px-4 py-4"><ProviderChip provider={row.provider} /></td>
                            <td className="px-4 py-4 text-right text-[13px] font-medium text-gray-300">{row._count.id.toLocaleString()}</td>
                            <td className="px-4 py-4 text-right">
                              <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                                row.successRate > 95 ? "text-emerald-400" : row.successRate > 80 ? "text-amber-400" : "text-red-400"
                              }`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
                                {row.successRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-[13px] font-bold text-emerald-400">
                              ${(row._sum.costUsd ?? 0).toFixed(4)}
                            </td>
                          </tr>
                        ))}
                        {topModels.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-[13px] text-gray-500">No models used in the last 7 days.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
