"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSeriesPoint {
  period: Date | string;
  totalRequests: number;
  totalCostUsd: number;
  cacheHits: number;
}

interface UsageChartProps {
  timeSeries: TimeSeriesPoint[];
  title?: string;
}

type View = "requests" | "cost";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeriod(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Format date securely to YYYY-MM-DD using local timezone to avoid off-by-one errors
function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── SVG Area Chart ───────────────────────────────────────────────────────────

interface AreaChartProps {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}

function AreaChart({ data, labels, color, height = 200 }: AreaChartProps) {
  const W = 600;
  const H = height;
  const PAD = { top: 14, right: 12, bottom: 32, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const min = 0;
  const max = Math.max(...data, 1);

  const scaleY = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;
  const scaleX = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;

  const linePath = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${scaleX(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  // Y-axis ticks (5 steps)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD.top + innerH * (1 - t),
    label:
      max >= 1000
        ? `${Math.round(max * t / 100) / 10}k`
        : max < 10
        ? (max * t).toFixed(2)
        : Math.round(max * t).toString(),
  }));

  // X-axis: pick at most 6 evenly spaced labels
  const xStep = Math.max(1, Math.floor(labels.length / 6));
  const xTicks = labels
    .map((label, i) => ({ label, x: scaleX(i), i }))
    .filter((_, i) => i % xStep === 0 || i === labels.length - 1);

  const gradId = `area-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      className="overflow-visible block"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <line
          key={i}
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={tick.y}
          y2={tick.y}
          className="stroke-white/[0.05]"
          strokeWidth="1"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick, i) => (
        <text
          key={i}
          x={PAD.left - 6}
          y={tick.y + 4}
          textAnchor="end"
          fill="#6b7280"
          fontSize="9"
        >
          {tick.label}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {data.map((v, i) => (
        <circle
          key={i}
          cx={scaleX(i)}
          cy={scaleY(v)}
          r="2.5"
          fill={color}
          opacity={1}
        />
      ))}

      {/* X-axis labels */}
      {xTicks.map(({ label, x }, i) => (
        <text
          key={i}
          x={x}
          y={PAD.top + innerH + 18}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="9"
        >
          {label}
        </text>
      ))}

      {/* X-axis baseline */}
      <line
        x1={PAD.left}
        x2={PAD.left + innerW}
        y1={PAD.top + innerH}
        y2={PAD.top + innerH}
        className="stroke-white/[0.08]"
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2"
      style={{ height }}
    >
      <div className="w-4 h-4 border-2 border-gray-600 rounded-sm opacity-20 rotate-45" />
      <span className="text-xs text-gray-500 font-medium">No usage data yet</span>
      <span className="text-[11px] text-gray-600">
        Data will appear once requests flow through your proxy
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsageChart({ timeSeries, title = "Usage Over Time" }: UsageChartProps) {
  const [view, setView] = useState<View>("requests");

  const { data, labels } = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return { data: [], labels: [] };
    const sorted = [...timeSeries].sort(
      (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    const dataMap = new Map<string, TimeSeriesPoint>();
    for (const p of sorted) {
      dataMap.set(toLocalDateString(new Date(p.period)), p);
    }

    const filled: TimeSeriesPoint[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Generate 30 days ending today
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateString(d);

      if (dataMap.has(dateStr)) {
        filled.push(dataMap.get(dateStr)!);
      } else {
        filled.push({
          period: d,
          totalRequests: 0,
          totalCostUsd: 0,
          cacheHits: 0,
        });
      }
    }
    const finalSeries = filled;

    return {
      data:
        view === "requests"
          ? finalSeries.map((p) => p.totalRequests)
          : finalSeries.map((p) => Number(p.totalCostUsd)),
      labels: finalSeries.map((p) => formatPeriod(p.period)),
    };
  }, [timeSeries, view]);

  // Aura Violet for requests, Aura Emerald for cost
  const chartColor = view === "requests" ? "#7c5cfc" : "#22c55e";
  const chartHeight = 200;
  const hasData = data.length >= 2;

  return (
    <div className="group relative bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col gap-4 h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
      {/* Subtle Aura Glow Shader */}
      <div 
        className={`absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.08] pointer-events-none transition-all duration-700 group-hover:opacity-[0.15] ${view === "requests" ? "bg-violet-500" : "bg-emerald-500"}`}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-gray-100">{title}</div>
          <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">Last 30 days · Daily</div>
        </div>

        {/* Toggle */}
        <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-md p-0.5 gap-0.5">
          {(["requests", "cost"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-[4px] border-none cursor-pointer text-[11px] font-semibold transition-all duration-150 ${
                view === v 
                  ? (v === "requests" ? "bg-violet-500/20 text-violet-400" : "bg-emerald-500/15 text-emerald-400") 
                  : "bg-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {v === "requests" ? "Requests" : "Cost"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative z-10 flex-1" style={{ minHeight: chartHeight }}>
        {hasData ? (
          <AreaChart data={data} labels={labels} color={chartColor} height={chartHeight} />
        ) : (
          <EmptyChart height={chartHeight} />
        )}
      </div>

      {/* Summary pills */}
      {hasData && (
        <div className="relative z-10 flex gap-6 pt-4 border-t border-white/5">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.06em] font-semibold">Total</div>
            <div className={`text-[13px] font-bold mt-1 ${view === "requests" ? "text-violet-400" : "text-emerald-400"}`}>
              {view === "requests"
                ? data.reduce((s, v) => s + v, 0).toLocaleString()
                : `$${data.reduce((s, v) => s + v, 0).toFixed(4)}`}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.06em] font-semibold">Peak</div>
            <div className="text-[13px] font-bold text-white mt-1">
              {view === "requests"
                ? Math.max(...data).toLocaleString()
                : `$${Math.max(...data).toFixed(4)}`}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.06em] font-semibold">Avg / day</div>
            <div className="text-[13px] font-bold text-white mt-1">
              {view === "requests"
                ? Math.round(data.reduce((s, v) => s + v, 0) / data.length).toLocaleString()
                : `$${(data.reduce((s, v) => s + v, 0) / data.length).toFixed(4)}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
