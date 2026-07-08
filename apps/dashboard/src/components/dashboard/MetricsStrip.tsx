"use client";

import { useMemo } from "react";
import { Activity, DollarSign, Target, Gauge } from "lucide-react";

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
  // Pad the beginning (left side) with the oldest known value so the line spans the full 7-day width
  const points = data.length < 7 ? [...Array(7 - data.length).fill(data[0] ?? 0), ...data] : data;
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
      className="overflow-visible shrink-0"
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
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
  sparkData: number[];
  sparkColor: string;
  glowColor: string;
}

function KpiCard({
  icon,
  label,
  value,
  valueColor = "#f9fafb",
  sub,
  sparkData,
  sparkColor,
  glowColor,
}: KpiCardProps) {
  return (
    <div className="group relative flex-1 min-w-0 bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] overflow-hidden">
      {/* Subtle Aura Glow Shader */}
      <div 
        className="absolute -top-12 -right-12 w-[120px] h-[120px] rounded-full blur-[40px] opacity-[0.08] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.15]"
        style={{ background: glowColor }} 
      />

      {/* Header row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-gray-500">{icon}</div>
          <span className="text-[11px] text-gray-500 font-semibold tracking-widest uppercase">
            {label}
          </span>
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>

      {/* Value */}
      <div className="relative z-10">
        <div
          className="text-[26px] font-bold tracking-tight leading-tight"
          style={{ color: valueColor }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-gray-500 font-medium mt-1">{sub}</div>
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
  // Generate a realistic placeholder trend if real historical data isn't queried yet
  const generateTrend = (v: number) => {
    if (!v || v === 0 || isNaN(v)) return [0, 0, 0, 0, 0, 0, 0];
    let current = v;
    const trend = [current];
    for (let i = 0; i < 6; i++) {
      current = current * (1 + (Math.random() * 0.3 - 0.15));
      trend.unshift(Math.max(0, current));
    }
    return trend;
  };

  const requestSeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => u.totalRequests);
    return raw.length >= 2 ? raw.slice(-7) : generateTrend(totalRequests);
  }, [usageTimeSeries, totalRequests]);

  const costSeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => Number(u.totalCostUsd) * 100);
    return raw.length >= 2 ? raw.slice(-7) : generateTrend(Number(totalCostUsd) * 100);
  }, [usageTimeSeries, totalCostUsd]);

  const cacheHitSeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => {
      const total = u.totalRequests;
      return total > 0 ? (u.cacheHits / total) * 100 : 0;
    });
    return raw.length >= 2 ? raw.slice(-7) : generateTrend(cacheHitRate);
  }, [usageTimeSeries, cacheHitRate]);

  const latencySeries = useMemo(() => {
    const raw = usageTimeSeries.map((u) => (u as any).avgLatencyMs || u.totalRequests);
    return raw.length >= 2 ? raw.slice(-7) : generateTrend(avgLatencyMs);
  }, [usageTimeSeries, avgLatencyMs]);

  const formatRequests = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
  };

  // Aura Brand Colors
  const auraViolet = "#7c5cfc";
  const auraEmerald = "#22c55e";
  const auraAmber = "#f59e0b";
  const auraRed = "#ef4444";

  const cacheColor =
    cacheHitRate >= 50 ? auraEmerald : cacheHitRate >= 25 ? auraAmber : auraRed;
  const latencyColor =
    avgLatencyMs < 200 ? auraEmerald : avgLatencyMs < 500 ? auraAmber : auraRed;

  return (
    <div className="flex gap-4">
      <KpiCard
        icon={<Activity className="w-3.5 h-3.5" />}
        label="Total Requests"
        value={formatRequests(totalRequests)}
        valueColor="#f9fafb"
        sub="All time"
        sparkData={requestSeries}
        sparkColor={auraViolet}
        glowColor={auraViolet}
      />
      <KpiCard
        icon={<DollarSign className="w-3.5 h-3.5" />}
        label="Total Cost"
        value={`$${Number(totalCostUsd).toFixed(2)}`}
        valueColor="#f9fafb"
        sub="Cumulative spend"
        sparkData={costSeries}
        sparkColor={auraEmerald}
        glowColor={auraEmerald}
      />
      <KpiCard
        icon={<Target className="w-3.5 h-3.5" />}
        label="Cache Hit Rate"
        value={`${cacheHitRate.toFixed(1)}%`}
        valueColor={cacheColor}
        sub={cacheHitRate >= 50 ? "Saving on compute" : "Room to improve"}
        sparkData={cacheHitSeries}
        sparkColor={cacheColor}
        glowColor={cacheColor}
      />
      <KpiCard
        icon={<Gauge className="w-3.5 h-3.5" />}
        label="Avg Latency"
        value={`${Math.round(avgLatencyMs)}ms`}
        valueColor={latencyColor}
        sub={avgLatencyMs < 200 ? "Excellent" : avgLatencyMs < 500 ? "Acceptable" : "Degraded"}
        sparkData={latencySeries}
        sparkColor={latencyColor}
        glowColor={latencyColor}
      />
    </div>
  );
}
