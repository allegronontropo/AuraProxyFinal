import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCacheStats } from "@/lib/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSeriesEntry {
  period: Date;
  cacheHits: number;
  cacheMisses: number;
  exactHits: number;
  semanticHits: number;
}

interface RecentEvent {
  id: string;
  createdAt: Date;
  provider: string;
  model: string;
  latencyMs: number;
  statusCode: number;
  cached: boolean;
  cacheHitType: string;
  similarityScore: number | null;
}

// ─── Area Chart SVG ───────────────────────────────────────────────────────────

function AreaChart({ data }: { data: { label: string; hits: number; misses: number }[] }) {
  const W = 600;
  const H = 200;
  const PAD = { top: 14, right: 12, bottom: 32, left: 48 };
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

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    y: PAD.top + cH - frac * cH,
    label: Math.round(maxVal * frac).toString(),
  }));

  const xStep = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data
    .map((d, i) => ({ label: d.label, x: scaleX(i), i }))
    .filter((_, i) => i % xStep === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible block">
      <defs>
        <linearGradient id="cache-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={tick.y} x2={PAD.left + cW} y2={tick.y}
            className="stroke-white/[0.05]" strokeWidth="1" />
          <text x={PAD.left - 6} y={tick.y + 4} fill="#6b7280" fontSize="9" textAnchor="end">
            {tick.label}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#cache-area-grad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#7c5cfc" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Data dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={scaleX(i)}
          cy={scaleY(d.hits)}
          r="2.5"
          fill="#7c5cfc"
          opacity={1}
        />
      ))}

      {/* X axis labels */}
      {xTicks.map(({ label, x }, i) => (
        <text key={i} x={x} y={PAD.top + cH + 18}
          textAnchor="middle" fill="#6b7280" fontSize="9">
          {label}
        </text>
      ))}

      {/* X axis baseline */}
      <line x1={PAD.left} x2={PAD.left + cW} y1={PAD.top + cH} y2={PAD.top + cH}
        className="stroke-white/[0.08]" strokeWidth="1" />
    </svg>
  );
}

// ─── Stacked Bar Chart ────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; hits: number; misses: number }[] }) {
  const last7 = data.slice(-7);
  const W = 600;
  const H = 140;
  const PAD = { top: 14, right: 12, bottom: 32, left: 48 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const barGroupW = cW / last7.length;
  const barW = Math.min(16, barGroupW * 0.4);
  const maxVal = Math.max(...last7.map((d) => d.hits + d.misses), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible block">
      {/* Grid lines */}
      {[0, 0.5, 1].map((frac) => {
        const y = PAD.top + cH - frac * cH;
        return (
          <g key={frac}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y}
              className="stroke-white/[0.05]" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} fill="#6b7280" fontSize="9" textAnchor="end">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {last7.map((d, i) => {
        const cx = PAD.left + i * barGroupW + barGroupW / 2;
        const hitH = Math.max((d.hits / maxVal) * cH, 1);
        const missH = Math.max((d.misses / maxVal) * cH, 1);
        const baseY = PAD.top + cH;
        return (
          <g key={i}>
            {/* Hits bar */}
            <rect
              x={cx - barW - 1} y={baseY - hitH}
              width={barW} height={hitH}
              fill="#22c55e" opacity="0.7" rx="2"
            />
            {/* Misses bar */}
            <rect
              x={cx + 1} y={baseY - missH}
              width={barW} height={missH}
              fill="#ef4444" opacity="0.65" rx="2"
            />
            <text x={cx} y={PAD.top + cH + 18}
              textAnchor="middle" fill="#6b7280" fontSize="9">
              {d.label}
            </text>
          </g>
        );
      })}

      {/* X-axis baseline */}
      <line x1={PAD.left} x2={PAD.left + cW} y1={PAD.top + cH} y2={PAD.top + cH}
        className="stroke-white/[0.08]" strokeWidth="1" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatSimilarity(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(2)}`;
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
    exactHits: r.exactHits,
    semanticHits: r.semanticHits,
  }));

  // If DB is empty, pad with 24 empty hours for the chart
  if (timeSeries.length === 0) {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    timeSeries = Array.from({ length: 24 }, (_, i) => ({
      period: new Date(now - (23 - i) * 60 * 60 * 1000),
      cacheHits: 0,
      cacheMisses: 0,
      exactHits: 0,
      semanticHits: 0,
    }));
  }

  // Aggregate totals
  const totalHits = timeSeries.reduce((s, r) => s + r.cacheHits, 0);
  const totalMisses = timeSeries.reduce((s, r) => s + r.cacheMisses, 0);
  const totalExactHits = timeSeries.reduce((s, r) => s + r.exactHits, 0);
  const totalSemanticHits = timeSeries.reduce((s, r) => s + r.semanticHits, 0);
  const hitRate =
    totalHits + totalMisses > 0
      ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1)
      : "0.0";

  // Chart data
  const chartData = timeSeries.map((r) => ({
    label: new Date(r.period).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    hits: r.cacheHits,
    misses: r.cacheMisses,
  }));

  const recentEvents = raw.recentEvents as RecentEvent[];
  const avgSemanticSimilarity = raw.avgSemanticSimilarity as number;
  const avgCacheLatency = raw.avgCacheLatency as number;
  const estimatedBandwidthSaved = formatBytes(raw.estimatedBandwidthSavedBytes);

  const hitRateColor =
    Number(hitRate) >= 50 ? "#22c55e" : Number(hitRate) >= 25 ? "#f59e0b" : "#ef4444";

  const hasData = totalHits + totalMisses > 0;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Bar */}
      <div className="h-[52px] shrink-0 bg-[rgba(13,13,15,0.8)] backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between px-6 z-10 relative">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-100">Cache Analytics</h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{hitRate}% Hit Rate</span>
          </div>
          {!hasData && (
            <span className="text-[11px] text-gray-600">- No data yet</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto z-10 relative">
        <div className="p-[22px] md:p-6 max-w-[1400px] mx-auto space-y-5">

          {/* ── Top row: KPI cards ── */}
          <div className="flex gap-4">
            {/* Hit Rate KPI */}
            <div className="group relative flex-1 min-w-0 bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] overflow-hidden">
              <div
                className="absolute -top-12 -right-12 w-[120px] h-[120px] rounded-full blur-[40px] opacity-[0.08] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.15]"
                style={{ background: hitRateColor }}
              />
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold tracking-widest uppercase">Cache Hit Rate</span>
              </div>
              <div className="relative z-10">
                <div className="text-[26px] font-bold tracking-tight leading-tight" style={{ color: hitRateColor }}>
                  {hitRate}%
                </div>
                <div className="text-[11px] text-gray-500 font-medium mt-1">requests served from cache</div>
              </div>
            </div>

            {/* Total Hits KPI */}
            <div className="group relative flex-1 min-w-0 bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] overflow-hidden">
              <div
                className="absolute -top-12 -right-12 w-[120px] h-[120px] rounded-full blur-[40px] opacity-[0.08] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.15]"
                style={{ background: "#7c5cfc" }}
              />
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold tracking-widest uppercase">Total Hits</span>
              </div>
              <div className="relative z-10">
                <div className="text-[26px] font-bold tracking-tight leading-tight text-gray-100">
                  {totalHits.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500 font-medium mt-1">all time · exact + semantic</div>
              </div>
            </div>

            {/* Total Misses KPI */}
            <div className="group relative flex-1 min-w-0 bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] overflow-hidden">
              <div
                className="absolute -top-12 -right-12 w-[120px] h-[120px] rounded-full blur-[40px] opacity-[0.08] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.15]"
                style={{ background: "#ef4444" }}
              />
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold tracking-widest uppercase">Total Misses</span>
              </div>
              <div className="relative z-10">
                <div className="text-[26px] font-bold tracking-tight leading-tight text-gray-100">
                  {totalMisses.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500 font-medium mt-1">all time</div>
              </div>
            </div>

            {/* Bandwidth Saved KPI */}
            <div className="group relative flex-1 min-w-0 bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] overflow-hidden">
              <div
                className="absolute -top-12 -right-12 w-[120px] h-[120px] rounded-full blur-[40px] opacity-[0.08] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.15]"
                style={{ background: "#22c55e" }}
              />
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-semibold tracking-widest uppercase">Bandwidth Saved</span>
              </div>
              <div className="relative z-10">
                <div className="text-[26px] font-bold tracking-tight leading-tight text-emerald-400">
                  {estimatedBandwidthSaved}
                </div>
                <div className="text-[11px] text-gray-500 font-medium mt-1">estimated</div>
              </div>
            </div>
          </div>

          {/* ── Middle row: two-column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Area Chart */}
            <div className="lg:col-span-3">
              <div className="group relative bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col gap-4 h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
                <div
                  className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.08] pointer-events-none transition-all duration-700 group-hover:opacity-[0.15] bg-violet-500"
                />
                <div className="relative z-10">
                  <div className="text-[13px] font-semibold text-gray-100">Cache Hits Over Time</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">Last 24 hours · Hourly</div>
                </div>
                <div className="relative z-10 flex-1" style={{ minHeight: 200 }}>
                  <AreaChart data={chartData} />
                </div>
                {hasData && (
                  <div className="relative z-10 flex gap-6 pt-4 border-t border-white/5">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-[0.06em] font-semibold">Total Hits</div>
                      <div className="text-[13px] font-bold text-violet-400 mt-1">{totalHits.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-[0.06em] font-semibold">Peak</div>
                      <div className="text-[13px] font-bold text-white mt-1">{Math.max(...chartData.map(d => d.hits)).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-[0.06em] font-semibold">Avg / hour</div>
                      <div className="text-[13px] font-bold text-white mt-1">{Math.round(totalHits / Math.max(chartData.length, 1)).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Cache Efficiency & Bar Chart */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Cache Efficiency */}
              <div className="group relative bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
                <div
                  className="absolute -bottom-16 -right-16 w-[150px] h-[150px] rounded-full blur-[60px] opacity-[0.08] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.15]"
                  style={{ background: "#7c5cfc" }}
                />
                <div className="relative z-10">
                  <div className="text-[13px] font-semibold text-gray-100">Cache Efficiency</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">Hit type breakdown</div>
                </div>
                <div className="relative z-10 flex flex-col gap-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium">Exact hits</span>
                    <span className="text-[13px] font-semibold text-emerald-400">{totalExactHits.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium">Semantic hits</span>
                    <span className="text-[13px] font-semibold text-violet-400">{totalSemanticHits.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium">Avg semantic similarity</span>
                    <span className="text-[13px] font-semibold text-gray-100">{formatSimilarity(avgSemanticSimilarity)}</span>
                  </div>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium">Avg cache latency</span>
                    <span className="text-[13px] font-semibold text-sky-400">{avgCacheLatency > 0 ? `${Math.round(avgCacheLatency)}ms` : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="group relative bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-gray-100">Hits vs Misses</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">Last 7 data points</div>
                  </div>
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
                <div className="relative z-10" style={{ minHeight: 140 }}>
                  <BarChart data={chartData} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom row: full-width Recent Cache Activity ── */}
          <RecentCacheActivityClient
            events={recentEvents.map((e) => ({
              ...e,
              createdAt: e.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}

import RecentCacheActivityClient from "@/components/dashboard/RecentCacheActivityClient";
