import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCacheStats } from "@/lib/queries";
import { ProviderIcon } from "@lobehub/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheByModel {
  model: string;
  provider: string;
  _count: { id: number };
  _sum: { hitCount: number | null };
}

interface TimeSeriesEntry {
  period: Date;
  cacheHits: number;
  cacheMisses: number;
}

// ─── Area Chart SVG ───────────────────────────────────────────────────────────

function AreaChart({ data }: { data: { label: string; hits: number; misses: number }[] }) {
  const W = 600;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 40 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const hitValues = data.map((d) => d.hits);
  const maxVal = Math.max(...hitValues, 1);

  const scaleX = (i: number) => {
    if (data.length <= 1) return PAD.left + cW / 2;
    return PAD.left + (i / (data.length - 1)) * cW;
  };
  const scaleY = (v: number) => PAD.top + cH - (v / maxVal) * cH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(d.hits).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${scaleX(data.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;

  // Tick labels — show every 4th point
  const ticks = data.filter((_, i) => i % 4 === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
      <defs>
        <linearGradient id="cache-grad" x1="0" y1="0" x2="0" y2="1">
          {/* Aura Violet */}
          <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y axis guide lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = PAD.top + cH - frac * cH;
        return (
          <g key={frac}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y}
              className="stroke-white/[0.04]" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} fill="#6b7280" fontSize="9" textAnchor="end">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#cache-grad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#7c5cfc" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* End dot */}
      <circle
        cx={scaleX(data.length - 1)}
        cy={scaleY(data[data.length - 1].hits)}
        r="3.5" fill="#7c5cfc"
      />

      {/* X axis labels */}
      {ticks.map((t) => {
        const i = data.indexOf(t);
        return (
          <text key={i} x={scaleX(i)} y={H - 6} fill="#6b7280" fontSize="9" textAnchor="middle">
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Stacked Bar Chart ────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; hits: number; misses: number }[] }) {
  const last7 = data.slice(-7);
  const W = 600;
  const H = 110;
  const PAD = { top: 8, right: 8, bottom: 24, left: 36 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const barGroupW = cW / last7.length;
  const barW = Math.min(14, barGroupW * 0.35);
  const maxVal = Math.max(...last7.map((d) => d.hits + d.misses), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
      {/* guide */}
      {[0, 0.5, 1].map((frac) => {
        const y = PAD.top + cH - frac * cH;
        return (
          <g key={frac}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y}
              className="stroke-white/[0.04]" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} fill="#6b7280" fontSize="8" textAnchor="end">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {last7.map((d, i) => {
        const cx = PAD.left + i * barGroupW + barGroupW / 2;
        const hitH = (d.hits / maxVal) * cH;
        const missH = (d.misses / maxVal) * cH;
        const baseY = PAD.top + cH;
        return (
          <g key={i}>
            {/* hits bar (Aura Success) */}
            <rect
              x={cx - barW - 1} y={baseY - hitH}
              width={barW} height={Math.max(hitH, 1)}
              fill="#22c55e" opacity="0.8" rx="2"
            />
            {/* misses bar (Aura Error) */}
            <rect
              x={cx + 1} y={baseY - missH}
              width={barW} height={Math.max(missH, 1)}
              fill="#ef4444" opacity="0.7" rx="2"
            />
            <text x={cx} y={H - 6} fill="#6b7280" fontSize="8.5" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

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
    <span className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.color} text-[10px] font-bold px-2.5 py-1 rounded-md capitalize tracking-[0.02em]`}>
      <ProviderIcon provider={provider} size={12} type="color" />
      {provider}
    </span>
  );
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CacheAnalyticsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { projectId } = await params;

  const raw = await getCacheStats(projectId);

  // Normalise data
  let timeSeries: TimeSeriesEntry[] = raw.timeSeries.map((r) => ({
    period: r.period,
    cacheHits: r.cacheHits,
    cacheMisses: r.cacheMisses,
  }));

  // If DB is completely empty for this period, pad with an empty 24-hour sequence for the chart
  if (timeSeries.length === 0) {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    timeSeries = Array.from({ length: 24 }, (_, i) => ({
      period: new Date(now - (23 - i) * 60 * 60 * 1000),
      cacheHits: 0,
      cacheMisses: 0,
    }));
  }

  const byModel: CacheByModel[] = raw.byModel as CacheByModel[];

  // Aggregate totals
  const totalHits = timeSeries.reduce((s, r) => s + r.cacheHits, 0);
  const totalMisses = timeSeries.reduce((s, r) => s + r.cacheMisses, 0);
  const hitRate =
    totalHits + totalMisses > 0
      ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1)
      : "0.0";

  // Today's slice (last entry)
  const todayHits = timeSeries[timeSeries.length - 1]?.cacheHits ?? 0;
  const todayMisses = timeSeries[timeSeries.length - 1]?.cacheMisses ?? 0;

  // Chart data
  const chartData = timeSeries.map((r) => ({
    label: new Date(r.period).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    hits: r.cacheHits,
    misses: r.cacheMisses,
  }));

  // Efficiency stats
  const totalEntries = byModel.reduce((s, m) => s + m._count.id, 0);
  const avgHitsPerEntry = totalEntries > 0 ? (totalHits / totalEntries).toFixed(1) : "0";
  const topModel = byModel[0]?.model ?? "—";
  const totalCacheHitCount = byModel.reduce((s, m) => s + (m._sum.hitCount ?? 0), 0);
  const estimatedBandwidthSaved = formatBytes(raw.estimatedBandwidthSavedBytes);

  const isEmpty = raw.timeSeries.length === 0 && (raw.byModel as CacheByModel[]).length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* TopBar */}
      <div className="flex items-center justify-between px-5 h-[52px] border-b border-white/5 shrink-0 bg-[#0D0D0F]/80">
        <div className="flex items-center gap-3">
          <span className="text-[16px] font-semibold text-white/90">Cache Analytics</span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_currentColor]" />
            {hitRate}% Hit Rate
          </span>
          {isEmpty && (
            <span className="text-[11px] text-gray-500">Demo data shown</span>
          )}
        </div>
        <button className="flex items-center gap-1.5 bg-white/[0.03] border border-white/10 rounded-md text-gray-400 text-xs px-3 py-1.5 cursor-pointer transition-all hover:bg-white/[0.06] hover:text-white">
          ↻ Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-6">

          {/* Area Chart Card */}
          <div className="group relative bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
            {/* Aura Shader Gradient Glow */}
            <div 
              className="absolute -top-16 -right-16 w-[200px] h-[200px] rounded-full blur-[60px] opacity-[0.12] pointer-events-none transition-opacity duration-500 group-hover:opacity-20"
              style={{ background: "#7c5cfc" }} 
            />
            
            <div className="relative z-10 text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Cache Hits Over Time
            </div>
            
            <div className="relative z-10">
              <AreaChart data={chartData} />
            </div>

            {/* Stats row below chart */}
            <div className="relative z-10 flex border-t border-white/5 pt-4 mt-4">
              <div className="flex-1 text-center">
                <div className="text-xl font-bold text-emerald-400">
                  {todayHits.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">hits (latest)</div>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div className="flex-1 text-center">
                <div className="text-xl font-bold text-red-400">
                  {todayMisses.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">misses (latest)</div>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div className="flex-1 text-center">
                <div className="text-xl font-bold text-white">
                  {totalHits.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">total hits (7d)</div>
              </div>
            </div>
          </div>

          {/* Bar Chart Card */}
          <div className="group bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Hits vs Misses — Last 7
              </span>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-emerald-400" />
                  Hits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-red-400" />
                  Misses
                </span>
              </div>
            </div>
            <BarChart data={chartData} />
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">

          {/* Big hit rate card */}
          <div className="group relative bg-emerald-500/[0.03] border border-emerald-500/20 rounded-[11px] p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30">
            {/* Aura Shader Gradient Glow */}
            <div 
              className="absolute inset-0 m-auto w-[150px] h-[150px] rounded-full blur-[60px] opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.25]"
              style={{ background: "#22c55e" }} 
            />
            
            <div className="relative z-10 text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mb-3">
              Cache Hit Rate
            </div>
            <div className="relative z-10 text-6xl font-extrabold text-emerald-400 leading-none">
              {hitRate}%
            </div>
            <div className="relative z-10 text-xs text-gray-500 mt-3 font-medium">
              requests served from cache
            </div>
            <div className="relative z-10 flex gap-8 mt-6">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{totalHits.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Total Hits</div>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div className="text-center">
                <div className="text-lg font-bold text-white">{totalMisses.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Total Misses</div>
              </div>
            </div>
          </div>

          {/* Model breakdown table */}
          <div className="group bg-white/[0.015] border border-white/[0.08] rounded-[11px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
            <div className="pt-5 px-5">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Model Breakdown
              </div>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Model</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Provider</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Entries</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Total Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {byModel.map((row, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      <td className="px-5 py-3.5 text-xs font-medium text-gray-100">
                        {row.model}
                      </td>
                      <td className="px-5 py-3.5">
                        <ProviderChip provider={row.provider} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {row._count.id.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-emerald-400">
                            {(row._sum.hitCount ?? 0).toLocaleString()}
                          </span>
                          <div className="flex-1 h-1 bg-white/[0.06] rounded-full max-w-[60px] overflow-hidden">
                            <div 
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${Math.round(((row._sum.hitCount ?? 0) / Math.max(totalCacheHitCount, 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {byModel.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-500">
                        No model data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cache efficiency card */}
          <div className="group relative bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
            {/* Aura Shader Gradient Glow */}
            <div 
              className="absolute -bottom-16 -right-16 w-[150px] h-[150px] rounded-full blur-[60px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.15]"
              style={{ background: "#7c5cfc" }} 
            />
            
            <div className="relative z-10 text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Cache Efficiency
            </div>
            
            <div className="relative z-10 flex flex-col gap-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Avg hits per cached entry</span>
                <span className="text-[13px] font-semibold text-gray-100">{avgHitsPerEntry}</span>
              </div>
              <div className="h-px bg-white/[0.05]" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Most popular model</span>
                <span className="text-xs font-semibold text-violet-400 font-mono tracking-tight bg-violet-500/10 px-2 py-0.5 rounded">{topModel}</span>
              </div>
              <div className="h-px bg-white/[0.05]" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Total cached entries</span>
                <span className="text-[13px] font-semibold text-gray-100">{totalEntries.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/[0.05]" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Bandwidth saved (est.)</span>
                <span className="text-[13px] font-bold text-emerald-400 flex items-center gap-1.5">
                  ~{estimatedBandwidthSaved}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
