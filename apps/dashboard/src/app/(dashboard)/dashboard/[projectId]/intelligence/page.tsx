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
    openai:    { bg: "rgba(16,163,127,0.15)", color: "#10a37f" },
    anthropic: { bg: "rgba(210,105,30,0.15)", color: "#d2691e" },
    google:    { bg: "rgba(66,133,244,0.15)", color: "#4285f4" },
    groq:      { bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
    azure:     { bg: "rgba(0,120,212,0.15)",   color: "#0078d4" },
    cohere:    { bg: "rgba(52,211,153,0.15)",  color: "#34d399" },
  };
  const cfg = map[provider.toLowerCase()] ?? { bg: "rgba(255,255,255,0.08)", color: "#9ca3af" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
      textTransform: "capitalize", letterSpacing: "0.02em"
    }}>
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
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle 
          cx={size / 2} cy={size / 2} r={radius} fill="transparent" 
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{percentage.toFixed(1)}<span style={{ fontSize: size * 0.12 }}>%</span></span>
        {label && <span style={{ fontSize: size * 0.1, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>{label}</span>}
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#09090b" }}>
      {/* TopBar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 60, flexShrink: 0,
        background: "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Activity className="w-5 h-5 text-gray-400" />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#f9fafb" }}>Gateway Insights</span>
        </div>
      </div>

      <style>{`
        .bento-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .bento-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.1);
        }
        .glow-bg {
          position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; 
          border-radius: 50%; filter: blur(60px); opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .content-z { position: relative; z-index: 1; }
      `}</style>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
        {isEmpty ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 300, background: "rgba(255,255,255,0.015)",
            border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 11,
            color: "#6b7280", fontSize: 14
          }}>
            No request data available yet. Make an API request to see gateway insights.
          </div>
        ) : (
          <>
            {/* ── BENTO ROW 1: Hero & Impact ── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
              
              {/* HERO: Gateway Status */}
              <div className="bento-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="glow-bg" style={{ background: status.successRate > 95 ? "#10b981" : "#f59e0b" }} />
                <div className="content-z" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Gateway Health</span>
                  </div>
                  <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                    Your API is running smoothly.<br/>
                    <span style={{ color: "#9ca3af", fontWeight: 500, fontSize: 18 }}>Routing requests with high reliability.</span>
                  </h2>
                  <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>TOTAL TRAFFIC</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb" }}>{status.totalRequests.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>AVG LATENCY</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb" }}>{formatMs(status.avgLatencyMs)}</div>
                    </div>
                  </div>
                </div>
                <div className="content-z" style={{ paddingRight: 24 }}>
                  <RadialProgress percentage={status.successRate} color={status.successRate > 95 ? "#10b981" : "#f59e0b"} label="Success" size={140} strokeWidth={10} />
                </div>
              </div>

              {/* IMPACT: Semantic Cache Savings */}
              <div className="bento-card" style={{ display: "flex", flexDirection: "column" }}>
                <div className="glow-bg" style={{ background: "#3b82f6", top: "auto", bottom: -50 }} />
                <div className="content-z" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cache Impact</span>
                </div>
                
                <div className="content-z" style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1, justifyContent: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>Money Saved</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{formatMoney(status.costSavedUsd)}</div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>Time Saved</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{formatMs(status.timeSavedMs)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BENTO ROW 2: Provider Race & Top Models ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
              
              {/* PROVIDER LEADERBOARD */}
              <div className="bento-card" style={{ display: "flex", flexDirection: "column" }}>
                <div className="content-z" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Speed Leaderboard</span>
                </div>
                
                <div className="content-z" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {leaderboard.map((prov, i) => {
                    // Max latency for bar scaling (assume max 3000ms for visual scale, or max of current)
                    const maxLat = Math.max(...leaderboard.map(l => l.avgLatencyMs), 1000);
                    const widthPct = Math.min(100, Math.max(5, (prov.avgLatencyMs / maxLat) * 100));
                    
                    return (
                      <div key={prov.provider} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? "#fbbf24" : "#6b7280" }}>#{i + 1}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", textTransform: "capitalize" }}>{prov.provider}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{formatMs(prov.avgLatencyMs)}</span>
                        </div>
                        {/* Bar */}
                        <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ 
                            height: "100%", width: `${widthPct}%`, 
                            background: i === 0 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "rgba(255,255,255,0.2)",
                            borderRadius: 3
                          }} />
                        </div>
                        {/* Success rate mini indicator if it's struggling */}
                        {prov.successRate < 95 && (
                          <div style={{ fontSize: 10, color: "#ef4444", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <AlertTriangle className="w-3 h-3" /> Error rate: {(100 - prov.successRate).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {leaderboard.length === 0 && <span style={{ color: "#6b7280", fontSize: 13 }}>No provider data.</span>}
                </div>
              </div>

              {/* TOP MODELS TABLE */}
              <div className="bento-card" style={{ display: "flex", flexDirection: "column" }}>
                <div className="content-z" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <Target className="w-5 h-5 text-pink-400" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Models (7 Days)</span>
                </div>

                <div className="content-z" style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Model</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Provider</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Requests</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Success Rate</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topModels.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i === topModels.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "16px 16px", fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>{row.model}</td>
                          <td style={{ padding: "16px 16px" }}><ProviderChip provider={row.provider} /></td>
                          <td style={{ padding: "16px 16px", textAlign: "right", fontSize: 13, color: "#d1d5db", fontWeight: 500 }}>{row._count.id.toLocaleString()}</td>
                          <td style={{ padding: "16px 16px", textAlign: "right" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              color: row.successRate > 95 ? "#10b981" : (row.successRate > 80 ? "#f59e0b" : "#ef4444"),
                              fontSize: 13, fontWeight: 600
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 6px currentColor" }} />
                              {row.successRate.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: "16px 16px", textAlign: "right", fontSize: 13, color: "#10b981", fontWeight: 700 }}>
                            ${(row._sum.costUsd ?? 0).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                      {topModels.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6b7280", fontSize: 13 }}>No models used in the last 7 days.</td>
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
