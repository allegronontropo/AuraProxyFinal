import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getGatewayStatus, 
  getGatewayProviderLeaderboard, 
  getGatewayTopModels 
} from "@/lib/queries";
import { Activity, ShieldCheck, Zap, DollarSign, Clock, Target, Trophy, AlertTriangle } from "lucide-react";

// ─── Provider Chip ────────────────────────────────────────────────────────────

function ProviderChip({ provider }: { provider: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    openai:    { bg: "bg-emerald-500/15", color: "text-emerald-500" },
    anthropic: { bg: "bg-amber-500/15", color: "text-amber-500" },
    google:    { bg: "bg-blue-500/15", color: "text-blue-500" },
    groq:      { bg: "bg-violet-500/15", color: "text-violet-500" },
    azure:     { bg: "bg-sky-500/15",   color: "text-sky-500" },
    cohere:    { bg: "bg-teal-500/15",  color: "text-teal-500" },
  };
  const cfg = map[provider.toLowerCase()] ?? { bg: "bg-white/10", color: "text-gray-400" };
  
  return (
    <span className={`inline-flex items-center justify-center ${cfg.bg} ${cfg.color} text-[11px] font-bold px-2.5 py-1 rounded-md capitalize tracking-[0.02em]`}>
      {provider}
    </span>
  );
}

// ─── Radial Progress SVG ──────────────────────────────────────────────────────

function RadialProgress({ percentage, color, label, size = 120, strokeWidth = 8 }: { percentage: number, color: string, label?: string, size?: number, strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle 
          cx={size / 2} cy={size / 2} r={radius} fill="transparent" 
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-extrabold text-white leading-none" style={{ fontSize: size * 0.22 }}>
          {percentage.toFixed(1)}<span style={{ fontSize: size * 0.12 }}>%</span>
        </span>
        {label && <span className="text-gray-400 font-semibold uppercase mt-0.5" style={{ fontSize: size * 0.1 }}>{label}</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // Formatting helpers
  const formatMoney = (v: number) => `$${v.toFixed(3)}`;
  const formatMs = (v: number) => `${Math.round(v)}ms`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* TopBar */}
      <div className="flex items-center justify-between px-5 h-[52px] border-b border-white/5 shrink-0 bg-[#0D0D0F]/80">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-gray-400" />
          <span className="text-[16px] font-semibold text-white/90">Gateway Insights</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        {isEmpty ? (
          <div className="flex items-center justify-center h-[300px] bg-white/[0.015] border border-dashed border-white/10 rounded-[11px] text-gray-500 text-sm">
            No request data available yet. Make an API request to see gateway insights.
          </div>
        ) : (
          <>
            {/* ── BENTO ROW 1: Hero & Impact ── */}
            <div className="grid grid-cols-[2fr_1fr] gap-6">
              
              {/* HERO: Gateway Status */}
              <div className="group relative overflow-hidden bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
                {/* Aura Shader Gradient Glow */}
                <div 
                  className="absolute -top-12 -right-12 w-[200px] h-[200px] rounded-full blur-[60px] opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30"
                  style={{ background: status.successRate > 95 ? "#22c55e" : "#f59e0b" }} 
                />
                
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Gateway Health</span>
                  </div>
                  <h2 className="text-[32px] font-extrabold text-white leading-tight">
                    Your API is running smoothly.<br/>
                    <span className="text-gray-400 font-medium text-lg">Routing requests with high reliability.</span>
                  </h2>
                  <div className="flex gap-8 mt-2">
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">TOTAL TRAFFIC</div>
                      <div className="text-xl font-bold text-gray-100">{status.totalRequests.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">AVG LATENCY</div>
                      <div className="text-xl font-bold text-gray-100">{formatMs(status.avgLatencyMs)}</div>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 pr-6">
                  <RadialProgress percentage={status.successRate} color={status.successRate > 95 ? "#22c55e" : "#f59e0b"} label="Success" size={140} strokeWidth={10} />
                </div>
              </div>

              {/* IMPACT: Semantic Cache Savings */}
              <div className="group relative overflow-hidden bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
                {/* Aura Shader Gradient Glow */}
                <div 
                  className="absolute -bottom-12 -right-12 w-[180px] h-[180px] rounded-full blur-[60px] opacity-[0.15] pointer-events-none transition-opacity duration-500 group-hover:opacity-25"
                  style={{ background: "#7c5cfc" }} 
                />
                
                <div className="relative z-10 flex items-center gap-2 mb-6">
                  <Zap className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Cache Impact</span>
                </div>
                
                <div className="relative z-10 flex flex-col gap-6 flex-1 justify-center">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-[13px] text-gray-400 font-medium">Money Saved</span>
                    </div>
                    <div className="text-3xl font-extrabold text-white">{formatMoney(status.costSavedUsd)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span className="text-[13px] text-gray-400 font-medium">Time Saved</span>
                    </div>
                    <div className="text-3xl font-extrabold text-white">{formatMs(status.timeSavedMs)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BENTO ROW 2: Provider Race & Top Models ── */}
            <div className="grid grid-cols-[1fr_2fr] gap-6">
              
              {/* PROVIDER LEADERBOARD */}
              <div className="group relative overflow-hidden bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
                <div className="relative z-10 flex items-center gap-2 mb-6">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Speed Leaderboard</span>
                </div>
                
                <div className="relative z-10 flex flex-col gap-4">
                  {leaderboard.map((prov, i) => {
                    const maxLat = Math.max(...leaderboard.map(l => l.avgLatencyMs), 1000);
                    const widthPct = Math.min(100, Math.max(5, (prov.avgLatencyMs / maxLat) * 100));
                    
                    return (
                      <div key={prov.provider} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${i === 0 ? "text-amber-400" : "text-gray-500"}`}>#{i + 1}</span>
                            <span className="text-[13px] font-semibold text-gray-100 capitalize">{prov.provider}</span>
                          </div>
                          <span className="text-[13px] font-bold text-white">{formatMs(prov.avgLatencyMs)}</span>
                        </div>
                        {/* Bar */}
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${widthPct}%`, 
                              background: i === 0 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "rgba(255,255,255,0.2)"
                            }} 
                          />
                        </div>
                        {/* Success rate mini indicator if it's struggling */}
                        {prov.successRate < 95 && (
                          <div className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Error rate: {(100 - prov.successRate).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {leaderboard.length === 0 && <span className="text-gray-500 text-[13px]">No provider data.</span>}
                </div>
              </div>

              {/* TOP MODELS TABLE */}
              <div className="group relative overflow-hidden bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
                <div className="relative z-10 flex items-center gap-2 mb-5">
                  <Target className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Top Models (7 Days)</span>
                </div>

                <div className="relative z-10 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Model</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Provider</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Requests</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Success Rate</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topModels.map((row, i) => (
                        <tr key={i} className={i === topModels.length - 1 ? "" : "border-b border-white/[0.03]"}>
                          <td className="px-4 py-4 text-[14px] font-semibold text-gray-100">{row.model}</td>
                          <td className="px-4 py-4"><ProviderChip provider={row.provider} /></td>
                          <td className="px-4 py-4 text-right text-[13px] text-gray-300 font-medium">{row._count.id.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                              row.successRate > 95 ? "text-emerald-400" : (row.successRate > 80 ? "text-amber-400" : "text-red-400")
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
                              {row.successRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-[13px] text-emerald-400 font-bold">
                            ${(row._sum.costUsd ?? 0).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                      {topModels.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500 text-[13px]">No models used in the last 7 days.</td>
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
  );
}
