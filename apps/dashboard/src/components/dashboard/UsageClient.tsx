"use client";

import React, { useState, useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface UsageDataPoint {
  model: string;
  provider: string;
  period: Date | string;
  totalRequests: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  totalCostUsd: number;
}

interface UsageClientProps {
  usageData: UsageDataPoint[];
  from: Date;
  to: Date;
}

type ViewMode = "cost" | "activity";

// Helper to format dates for x-axis
function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatDateShort(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Simple SVG Bar Chart Components ──────────────────────────────────────────

// Base Bar Chart
function BaseBarChart({
  data,
  maxVal,
  valueFn,
  color,
  formatValue,
  hoverLabel,
}: {
  data: UsageDataPoint[];
  maxVal: number;
  valueFn: (d: UsageDataPoint) => number;
  color: string;
  formatValue: (v: number) => string;
  hoverLabel: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const W = 400;
  const H = 200;
  const PAD = { top: 20, right: 10, bottom: 30, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const barWidth = Math.max(1, (innerW / Math.max(data.length, 1)) - 4);
  
  // Y-axis ticks
  const yTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

  return (
    <div style={{ position: "relative", width: "100%", height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }}>
        
        {/* Y Axis Guides */}
        {yTicks.map((tick, i) => {
          const yPos = PAD.top + innerH - (tick / (maxVal || 1)) * innerH;
          return (
            <g key={i}>
              <text x={PAD.left - 8} y={yPos} fill="#9ca3af" fontSize="10" textAnchor="end" dominantBaseline="middle">
                {formatValue(tick)}
              </text>
              <line 
                x1={PAD.left} x2={W - PAD.right} 
                y1={yPos} 
                y2={yPos} 
                stroke="rgba(255,255,255,0.05)" 
              />
            </g>
          );
        })}

        {/* X Axis labels (first and last) */}
        {data.length > 0 && (
          <>
            <text x={PAD.left} y={H - 5} fill="#9ca3af" fontSize="10" textAnchor="start">
              {formatDate(data[0].period)}
            </text>
            <text x={W - PAD.right} y={H - 5} fill="#9ca3af" fontSize="10" textAnchor="end">
              {formatDate(data[data.length - 1].period)}
            </text>
          </>
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const val = valueFn(d);
          const x = PAD.left + (i / Math.max(data.length, 1)) * innerW + 2;
          const barHeight = (val / (maxVal || 1)) * innerH;
          const y = PAD.top + innerH - barHeight;
          const isHovered = hoverIndex === i;

          return (
            <g 
              key={i} 
              onMouseEnter={() => setHoverIndex(i)} 
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Invisible wider rect for easier hover targeting */}
              <rect x={x - 2} y={PAD.top} width={barWidth + 4} height={innerH} fill="transparent" />
              
              {/* Hover background */}
              {isHovered && <rect x={x - 2} y={PAD.top} width={barWidth + 4} height={innerH} fill="rgba(255,255,255,0.05)" rx={2} />}
              
              {/* Actual bar */}
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} opacity={isHovered ? 1 : 0.8} />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && (
        <div style={{
          position: "absolute",
          top: "40%",
          left: `${(PAD.left + (hoverIndex / Math.max(data.length, 1)) * innerW) / W * 100}%`,
          transform: "translate(-50%, -50%)",
          background: "rgba(13,13,15,0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "12px",
          borderRadius: 8,
          pointerEvents: "none",
          zIndex: 10,
          minWidth: 160,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, fontWeight: 500 }}>
            {formatDateShort(data[hoverIndex].period)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 13, color: "#d1d5db" }}>{hoverLabel}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>
              {formatValue(valueFn(data[hoverIndex]))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Stacked Bar Chart for Tokens
function StackedTokensChart({ data, maxVal }: { data: UsageDataPoint[]; maxVal: number }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const W = 400;
  const H = 200;
  const PAD = { top: 20, right: 10, bottom: 30, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const barWidth = Math.max(1, (innerW / Math.max(data.length, 1)) - 4);
  
  const yTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];
  
  const formatCompact = (v: number) => {
    if (v === 0) return "0";
    if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
    if (v >= 1000) return (v / 1000).toFixed(1) + "K";
    return v.toString();
  };

  return (
    <div style={{ position: "relative", width: "100%", height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }}>
        
        {/* Y Axis Guides */}
        {yTicks.map((tick, i) => {
          const yPos = PAD.top + innerH - (tick / (maxVal || 1)) * innerH;
          return (
            <g key={i}>
              <text x={PAD.left - 8} y={yPos} fill="#9ca3af" fontSize="10" textAnchor="end" dominantBaseline="middle">
                {formatCompact(tick)}
              </text>
              <line 
                x1={PAD.left} x2={W - PAD.right} 
                y1={yPos} 
                y2={yPos} 
                stroke="rgba(255,255,255,0.05)" 
              />
            </g>
          );
        })}

        {/* X Axis labels (first and last) */}
        {data.length > 0 && (
          <>
            <text x={PAD.left} y={H - 5} fill="#9ca3af" fontSize="10" textAnchor="start">
              {formatDate(data[0].period)}
            </text>
            <text x={W - PAD.right} y={H - 5} fill="#9ca3af" fontSize="10" textAnchor="end">
              {formatDate(data[data.length - 1].period)}
            </text>
          </>
        )}

        {/* Stacked Bars */}
        {data.map((d, i) => {
          const x = PAD.left + (i / Math.max(data.length, 1)) * innerW + 2;
          const isHovered = hoverIndex === i;
          
          // Output tokens on bottom, Input tokens on top
          const outH = (d.tokensOut / (maxVal || 1)) * innerH;
          const inH = (d.tokensIn / (maxVal || 1)) * innerH;
          
          const yOut = PAD.top + innerH - outH;
          const yIn = yOut - inH;

          return (
            <g 
              key={i} 
              onMouseEnter={() => setHoverIndex(i)} 
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Invisible wider rect for hover */}
              <rect x={x - 2} y={PAD.top} width={barWidth + 4} height={innerH} fill="transparent" />
              
              {/* Hover background */}
              {isHovered && <rect x={x - 2} y={PAD.top} width={barWidth + 4} height={innerH} fill="rgba(255,255,255,0.05)" rx={2} />}
              
              {/* Output Tokens (Lighter Green) */}
              <rect x={x} y={yOut} width={barWidth} height={outH} fill="#6ee7b7" opacity={isHovered ? 1 : 0.8} />
              {/* Input Tokens (Darker Green) */}
              <rect x={x} y={yIn} width={barWidth} height={inH} fill="#059669" opacity={isHovered ? 1 : 0.8} />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && (
        <div style={{
          position: "absolute",
          top: "40%",
          left: `${(PAD.left + (hoverIndex / Math.max(data.length, 1)) * innerW) / W * 100}%`,
          transform: "translate(-50%, -50%)",
          background: "rgba(13,13,15,0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "16px",
          borderRadius: 8,
          pointerEvents: "none",
          zIndex: 10,
          minWidth: 200,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12, fontWeight: 500 }}>
            {formatDateShort(data[hoverIndex].period)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
                <span style={{ fontSize: 13, color: "#d1d5db" }}>Input Tokens</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>
                {formatCompact(data[hoverIndex].tokensIn)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6ee7b7" }} />
                <span style={{ fontSize: 13, color: "#d1d5db" }}>Output Tokens</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>
                {formatCompact(data[hoverIndex].tokensOut)}
              </span>
            </div>
            <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>
                {formatCompact(data[hoverIndex].totalTokens)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Usage Client ────────────────────────────────────────────────────────

export default function UsageClient({ usageData, from, to }: UsageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("activity");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Group and sort data
  const dataByModel = useMemo(() => {
    const grouped = new Map<string, UsageDataPoint[]>();
    for (const d of usageData) {
      if (!grouped.has(d.model)) grouped.set(d.model, []);
      grouped.get(d.model)!.push(d);
    }
    
    const result: { model: string; provider: string; data: UsageDataPoint[] }[] = [];
    grouped.forEach((data, model) => {
      data.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
      result.push({ model, provider: data[0]?.provider || "Unknown", data });
    });
    
    return result.sort((a, b) => b.data.reduce((sum, d) => sum + d.totalRequests, 0) - a.data.reduce((sum, d) => sum + d.totalRequests, 0));
  }, [usageData]);

  // Handle Date Selection
  const setDateRange = (days: number) => {
    const newTo = new Date();
    const newFrom = new Date();
    newFrom.setDate(newTo.getDate() - days);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", newFrom.toISOString().split("T")[0]);
    params.set("to", newTo.toISOString().split("T")[0]);
    router.push(`?${params.toString()}`);
    setDatePickerOpen(false);
  };

  const formatCost = (v: number) => {
    if (v === 0) return "$0.00";
    if (v < 0.01) return `$${v.toFixed(4)}`;
    return `$${v.toFixed(2)}`;
  };
  const formatReq = (v: number) => v.toLocaleString();

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#09090b", color: "#f9fafb" }}>
      
      {/* Top Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 60, borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Usage</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* Title & Date Picker Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>View usage data</h1>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Note: Data can be delayed by up to 15 minutes. All data shown in UTC time.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            
            {/* View Mode Toggle */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: 4 }}>
              {(["cost", "activity"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "6px 16px", borderRadius: 4, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 500, textTransform: "capitalize",
                    background: viewMode === mode ? "rgba(255,255,255,0.1)" : "transparent",
                    color: viewMode === mode ? "#f9fafb" : "#6b7280",
                    transition: "all 0.2s"
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Picker */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDatePickerOpen(!datePickerOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  padding: "8px 16px", borderRadius: 6, color: "#f9fafb", cursor: "pointer",
                  fontSize: 13, fontWeight: 500
                }}
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDateShort(from)} - {formatDateShort(to)}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
              </button>

              {datePickerOpen && (
                <div style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 8,
                  background: "#18181b", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: 6, zIndex: 50, minWidth: 200,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                }}>
                  {[
                    { label: "Last 7 Days", days: 7 },
                    { label: "Last 30 Days", days: 30 },
                    { label: "Last 90 Days", days: 90 },
                  ].map((option) => (
                    <button
                      key={option.days}
                      onClick={() => setDateRange(option.days)}
                      style={{
                        width: "100%", textAlign: "left", padding: "8px 12px",
                        background: "transparent", border: "none", color: "#e5e7eb",
                        fontSize: 13, cursor: "pointer", borderRadius: 4,
                        display: "flex", justifyContent: "space-between"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        {dataByModel.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "64px 24px", 
            background: "rgba(255,255,255,0.02)", borderRadius: 12,
            color: "#9ca3af", fontSize: 14
          }}>
            No usage data available for this period.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {dataByModel.map(({ model, provider, data }) => (
              <div key={model} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{model}</h2>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>{provider}</span>
                </div>

                {viewMode === "cost" ? (
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "24px" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 24, color: "#d1d5db" }}>Total Cost</h3>
                    <BaseBarChart 
                      data={data}
                      maxVal={Math.max(...data.map(d => d.totalCostUsd), 0.01)}
                      valueFn={(d) => d.totalCostUsd}
                      color="#10b981"
                      formatValue={formatCost}
                      hoverLabel="Cost"
                    />
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "24px" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 24, color: "#d1d5db" }}>Requests</h3>
                      <BaseBarChart 
                        data={data}
                        maxVal={Math.max(...data.map(d => d.totalRequests), 1)}
                        valueFn={(d) => d.totalRequests}
                        color="#10b981"
                        formatValue={formatReq}
                        hoverLabel="Requests"
                      />
                    </div>
                    
                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "24px" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 24, color: "#d1d5db" }}>Tokens</h3>
                      <StackedTokensChart 
                        data={data}
                        maxVal={Math.max(...data.map(d => d.totalTokens), 1)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
