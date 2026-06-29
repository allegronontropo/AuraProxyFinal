"use client";

import { useState, useEffect } from "react";

// ─── types ────────────────────────────────────────────────────────────────────

export type InsightAction = {
  label: string;
  desc: string;
  primary: boolean;
};

export type AffectedProvider = {
  name: string;
  latency: number;
  baseline: number;
  role: string;
  icon: string;
  color: string;
};

export type Insight = {
  id: string;
  impact: "high" | "medium" | "optimization";
  category: string;
  title: string;
  why: string;
  confidence: number;
  affectedProviders: AffectedProvider[];
  signalData: number[];
  actions: InsightAction[];
  actions_bar: string[];
};

const SORT_OPTIONS = ["Impact (High to Low)", "Confidence", "Most Recent"];

// ─── sub-components ───────────────────────────────────────────────────────────

function ImpactBadge({ impact }: { impact: Insight["impact"] }) {
  const cfg = {
    high: { label: "High Impact", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", color: "#f87171", icon: "▲" },
    medium: { label: "Medium Impact", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", color: "#fbbf24", icon: "●" },
    optimization: { label: "Optimization", bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.3)", color: "#a78bfa", icon: "◆" },
  }[impact];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
    }}>
      <span style={{ fontSize: 9 }}>{cfg.icon}</span>{cfg.label}
    </span>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 90 ? "#34d399" : value >= 75 ? "#fbbf24" : "#f87171";
  return (
    <span style={{ fontSize: 12, color: "#6b7280" }}>
      Confidence: <span style={{ color, fontWeight: 600 }}>{value}%</span>
    </span>
  );
}

function MiniChart({ data, color = "#ef4444", baseline = 40 }: { data: number[], color?: string, baseline?: number }) {
  const w = 220, h = 100;
  const min = Math.min(...data, baseline) - 5;
  const max = Math.max(...data, baseline) + 5;
  const scaleY = (v: number) => h - ((v - min) / (max - min)) * h;
  const scaleX = (i: number) => (i / (data.length - 1)) * w;
  const linePath = data.map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  const baseY = scaleY(baseline).toFixed(1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1="0" y1={baseY} x2={w} y2={baseY} stroke="#1d9e75" strokeWidth="1" strokeDasharray="4 3" opacity={0.6} />
      <path d={areaPath} fill={`url(#grad-${color.replace("#","")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1])} r="3.5" fill={color} />
      <text x="4" y={Number(baseY) - 4} fill="#1d9e75" fontSize="9" opacity={0.7}>baseline</text>
    </svg>
  );
}

function ActionButton({ label, icon }: { label: string, icon?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: hover ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7,
        color: "#d1d5db", fontSize: 12, padding: "7px 13px", cursor: "pointer",
        transition: "all 0.13s", whiteSpace: "nowrap",
      }}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {label}
    </button>
  );
}

function InsightCard({ insight, active, onClick }: { insight: Insight, active: boolean, onClick: () => void }) {
  const accentMap = { high: "#ef4444", medium: "#f59e0b", optimization: "#7c3aed" };
  const accent = accentMap[insight.impact];
  return (
    <div
      onClick={onClick}
      style={{
        border: active ? `1px solid ${accent}55` : "1px solid rgba(255,255,255,0.07)",
        background: active ? `${accent}08` : "rgba(255,255,255,0.015)",
        borderRadius: 11, padding: "18px 20px", cursor: "pointer",
        transition: "all 0.15s", marginBottom: 12,
        boxShadow: active ? `0 0 0 1px ${accent}22` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ImpactBadge impact={insight.impact} />
          <span style={{ fontSize: 11, color: "#6b7280" }}>{insight.category}</span>
        </div>
        <ConfidencePill value={insight.confidence} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#f9fafb", marginBottom: 6 }}>{insight.title}</div>
      <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.55, marginBottom: 14 }}>
        <span style={{ color: "#6b7280", fontWeight: 500 }}>Why: </span>{insight.why}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {insight.actions_bar.map((a, i) => (
          <ActionButton key={i} label={a} icon={i === 0 ? "⬡" : i === 1 ? "+" : "→"} />
        ))}
      </div>
    </div>
  );
}

function Inspector({ insight, onClose }: { insight: Insight | null, onClose: () => void }) {
  if (!insight) return null;
  const chartColor = insight.impact === "optimization" ? "#34d399" : "#ef4444";

  const timeLabels = ["-15m", "-12m", "-9m", "-6m", "-3m", "Now"];

  return (
    <div style={{
      width: 300, background: "#0d0d0f", borderLeft: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", fontWeight: 600 }}>
          Active Inspector
        </span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#4b5563", cursor: "pointer",
          fontSize: 16, lineHeight: 1, padding: "2px 4px", borderRadius: 4,
        }}>✕</button>
      </div>

      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb", lineHeight: 1.35, marginBottom: 18 }}>
          {insight.title}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>⬢</span> Supporting Signals
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "12px 12px 6px" }}>
            <MiniChart data={insight.signalData} color={chartColor} baseline={insight.signalData[0]} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {timeLabels.map(l => (
                <span key={l} style={{ fontSize: 9, color: "#4b5563" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>⬡</span> Affected Providers &amp; Routes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {insight.affectedProviders.map((p, i) => {
              const isHigh = p.latency > p.baseline * 1.2;
              return (
                <div key={i} style={{
                  background: i === 0 && isHigh ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.02)",
                  border: i === 0 && isHigh ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, padding: "10px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: `${p.color}22`, border: `1px solid ${p.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: p.color, fontWeight: 700, flexShrink: 0,
                    }}>{p.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#f9fafb" }}>{p.name}</div>
                      <div style={{ fontSize: 10, marginTop: 1 }}>
                        <span style={{ color: isHigh ? "#f87171" : "#34d399" }}>Latency: {p.latency}ms</span>
                        <span style={{ color: "#4b5563" }}> (Baseline: {p.baseline}ms)</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "#6b7280" }}>{p.role}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>⚡</span> Recommended Actions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insight.actions.map((action, i) => (
              <div key={i} style={{
                background: action.primary ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.02)",
                border: action.primary ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "11px 13px", cursor: "pointer",
                transition: "all 0.13s",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: action.primary ? "#c4b5fd" : "#d1d5db", marginBottom: 4 }}>
                  {action.label}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.45 }}>{action.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main client component ───────────────────────────────────────────────────

export default function IntelligenceHubClient({ initialInsights }: { initialInsights: Insight[] }) {
  const [activeInsight, setActiveInsight] = useState<Insight | null>(initialInsights[0] || null);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [routeCount, setRouteCount] = useState(420);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({ high: true, medium: true, optimization: true });

  useEffect(() => {
    const t = setInterval(() => {
      setRouteCount(c => c + Math.floor(Math.random() * 3 - 1));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const sorted = [...initialInsights]
    .filter(i => activeFilters[i.impact])
    .sort((a, b) => {
      if (sort === SORT_OPTIONS[1]) return b.confidence - a.confidence;
      if (sort === SORT_OPTIONS[0]) {
        const order = { high: 0, medium: 1, optimization: 2 };
        return order[a.impact] - order[b.impact];
      }
      return 0; // Most Recent
    });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0, background: "rgba(13,13,15,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Intelligence Hub</span>
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#a78bfa",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "pulse 1.8s infinite" }} />
            Analyzing {routeCount}M Routes
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Capacity Forecast: <span style={{ color: "#34d399", fontWeight: 600 }}>Optimal (92%)</span>
          </span>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setFilterOpen(f => !f); setShowSortMenu(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: filterOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7,
                color: "#d1d5db", fontSize: 12, padding: "6px 12px", cursor: "pointer",
              }}
            >
              ▼ Filter
            </button>
            {filterOpen && (
              <div style={{
                position: "absolute", right: 0, top: 36, background: "#1a1a1e",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
                padding: "8px", minWidth: 170, zIndex: 20,
              }}>
                {[
                  { key: "high", label: "High Impact", color: "#f87171" },
                  { key: "medium", label: "Medium Impact", color: "#fbbf24" },
                  { key: "optimization", label: "Optimization", color: "#a78bfa" },
                ].map(f => (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", cursor: "pointer", borderRadius: 5 }}>
                    <input type="checkbox" checked={activeFilters[f.key]}
                      onChange={() => setActiveFilters(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                      style={{ accentColor: "#7c3aed" }}
                    />
                    <span style={{ fontSize: 12, color: f.color }}>{f.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#7c3aed", border: "none", borderRadius: 7,
            color: "#fff", fontSize: 12, fontWeight: 500, padding: "7px 14px", cursor: "pointer",
          }}>
            ⚡ Auto-Resolve All
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Insights list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", fontWeight: 600 }}>
              Prioritized Insights
            </span>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowSortMenu(m => !m); setFilterOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6, color: "#9ca3af", fontSize: 11, padding: "5px 10px", cursor: "pointer",
                }}
              >
                Sort: {sort} ▾
              </button>
              {showSortMenu && (
                <div style={{
                  position: "absolute", right: 0, top: 32, background: "#1a1a1e",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "4px", minWidth: 180, zIndex: 20,
                }}>
                  {SORT_OPTIONS.map(o => (
                    <button key={o} onClick={() => { setSort(o); setShowSortMenu(false); }} style={{
                      display: "block", width: "100%", textAlign: "left",
                      background: sort === o ? "rgba(124,58,237,0.1)" : "none",
                      border: "none", color: sort === o ? "#c4b5fd" : "#d1d5db",
                      fontSize: 12, padding: "7px 10px", borderRadius: 5, cursor: "pointer",
                    }}>{o}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: "center", color: "#4b5563", fontSize: 13, paddingTop: 60 }}>
              No insights match the current filters.
            </div>
          ) : (
            sorted.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                active={activeInsight?.id === insight.id}
                onClick={() => setActiveInsight(activeInsight?.id === insight.id ? null : insight)}
              />
            ))
          )}
        </div>

        {/* Inspector */}
        <Inspector insight={activeInsight} onClose={() => setActiveInsight(null)} />
      </div>
    </div>
  );
}
