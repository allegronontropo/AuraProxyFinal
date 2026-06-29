"use client";

import { useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageRecord {
  period: Date | string;
  totalRequests: number;
  totalCostUsd: number;
  cacheHits: number;
}

interface MetricsStripProps {
  totalRequests: number;
  totalCostUsd: number;
  cacheHitRate: number;
  avgLatencyMs: number;
  usageTimeSeries: UsageRecord[];
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 72,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const points = data.length < 2 ? [...data, ...Array(7 - data.length).fill(data[0] ?? 0)] : data;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const scaleY = (v: number) => height - ((v - min) / range) * (height - 4) - 2;
  const scaleX = (i: number) => (i / (points.length - 1)) * width;

  const linePath = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `spark-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ overflow: "visible", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={scaleX(points.length - 1)}
        cy={scaleY(points[points.length - 1])}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
  sparkData: number[];
  sparkColor: string;
}

function KpiCard({
  icon,
  label,
  value,
  valueColor = "#f9fafb",
  sub,
  sparkData,
  sparkColor,
}: KpiCardProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 11,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1 }}>{icon}</span>
          <span
            style={{
              fontSize: 11,
              color: "#6b7280",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>

      {/* Value */}
      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: valueColor,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MetricsStrip({
  totalRequests,
  totalCostUsd,
  cacheHitRate,
  avgLatencyMs,
  usageTimeSeries,
}: MetricsStripProps) {
  const requestSeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => u.totalRequests);
    return raw.length >= 2 ? raw.slice(-7) : [0, 2, 1, 4, 3, 6, 5];
  }, [usageTimeSeries]);

  const costSeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => Number(u.totalCostUsd) * 100);
    return raw.length >= 2 ? raw.slice(-7) : [0, 1, 2, 1, 3, 2, 4];
  }, [usageTimeSeries]);

  const cacheHitSeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => {
      const total = u.totalRequests;
      return total > 0 ? (u.cacheHits / total) * 100 : 0;
    });
    return raw.length >= 2 ? raw.slice(-7) : [30, 42, 55, 48, 61, 58, 65];
  }, [usageTimeSeries]);

  const latencySeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => u.totalRequests);
    return raw.length >= 2 ? raw.slice(-7) : [180, 160, 220, 190, 140, 170, 155];
  }, [usageTimeSeries]);

  const formatRequests = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
  };

  const cacheColor =
    cacheHitRate >= 50 ? "#34d399" : cacheHitRate >= 25 ? "#f59e0b" : "#ef4444";
  const latencyColor =
    avgLatencyMs < 200 ? "#34d399" : avgLatencyMs < 500 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", gap: 14 }}>
      <KpiCard
        icon="⬡"
        label="Total Requests"
        value={formatRequests(totalRequests)}
        valueColor="#f9fafb"
        sub="All time"
        sparkData={requestSeries}
        sparkColor="#7c3aed"
      />
      <KpiCard
        icon="◈"
        label="Total Cost"
        value={`$${Number(totalCostUsd).toFixed(2)}`}
        valueColor="#f9fafb"
        sub="Cumulative spend"
        sparkData={costSeries}
        sparkColor="#a78bfa"
      />
      <KpiCard
        icon="◉"
        label="Cache Hit Rate"
        value={`${cacheHitRate.toFixed(1)}%`}
        valueColor={cacheColor}
        sub={cacheHitRate >= 50 ? "Saving on compute" : "Room to improve"}
        sparkData={cacheHitSeries}
        sparkColor={cacheColor}
      />
      <KpiCard
        icon="⚡"
        label="Avg Latency"
        value={`${Math.round(avgLatencyMs)}ms`}
        valueColor={latencyColor}
        sub={avgLatencyMs < 200 ? "Excellent" : avgLatencyMs < 500 ? "Acceptable" : "Degraded"}
        sparkData={latencySeries}
        sparkColor={latencyColor}
      />
    </div>
  );
}
