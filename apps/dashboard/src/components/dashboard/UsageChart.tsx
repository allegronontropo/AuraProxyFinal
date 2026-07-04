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

// ─── Helper: format date label ────────────────────────────────────────────────

function formatPeriod(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
      style={{ overflow: "visible", display: "block" }}
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
          stroke="rgba(255,255,255,0.05)"
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
          opacity={i === data.length - 1 ? 1 : 0}
        />
      ))}

      {/* Last dot always visible */}
      <circle
        cx={scaleX(data.length - 1)}
        cy={scaleY(data[data.length - 1])}
        r="3"
        fill={color}
      />

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
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 24, opacity: 0.2 }}>◈</span>
      <span style={{ fontSize: 12, color: "#4b5563" }}>No usage data yet</span>
      <span style={{ fontSize: 11, color: "#374151" }}>
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

    // If there's only 1 day of data, backfill the last 7 days with zeros so the chart always renders a nice line
    if (sorted.length === 1) {
      const singleDate = new Date(sorted[0].period);
      for (let i = 1; i <= 6; i++) {
        const d = new Date(singleDate);
        d.setDate(singleDate.getDate() - i);
        sorted.unshift({
          period: d,
          totalRequests: 0,
          totalCostUsd: 0,
          cacheHits: 0,
        } as TimeSeriesPoint);
      }
    }

    return {
      data:
        view === "requests"
          ? sorted.map((p) => p.totalRequests)
          : sorted.map((p) => Number(p.totalCostUsd)),
      labels: sorted.map((p) => formatPeriod(p.period)),
    };
  }, [timeSeries, view]);

  const chartColor = view === "requests" ? "#7c3aed" : "#34d399";
  const chartHeight = 200;
  const hasData = data.length >= 2;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 11,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>{title}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Last 30 days · Daily</div>
        </div>

        {/* Toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 7,
            padding: 2,
            gap: 2,
          }}
        >
          {(["requests", "cost"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "5px 12px",
                borderRadius: 5,
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                transition: "all 0.13s",
                background: view === v ? (v === "requests" ? "rgba(124,58,237,0.2)" : "rgba(52,211,153,0.15)") : "transparent",
                color: view === v ? (v === "requests" ? "#a78bfa" : "#34d399") : "#6b7280",
              }}
            >
              {v === "requests" ? "Requests" : "Cost"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: chartHeight }}>
        {hasData ? (
          <AreaChart data={data} labels={labels} color={chartColor} height={chartHeight} />
        ) : (
          <EmptyChart height={chartHeight} />
        )}
      </div>

      {/* Summary pills */}
      {hasData && (
        <div style={{ display: "flex", gap: 16, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Total
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", marginTop: 2 }}>
              {view === "requests"
                ? data.reduce((s, v) => s + v, 0).toLocaleString()
                : `$${data.reduce((s, v) => s + v, 0).toFixed(4)}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Peak
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", marginTop: 2 }}>
              {view === "requests"
                ? Math.max(...data).toLocaleString()
                : `$${Math.max(...data).toFixed(4)}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Avg / day
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", marginTop: 2 }}>
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
