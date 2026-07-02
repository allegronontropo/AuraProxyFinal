import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getGatewayProviderHealth, 
  getGatewayTopModels, 
  getGatewayLatencyDistribution 
} from "@/lib/queries";

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
      display: "inline-block",
      background: cfg.bg,
      color: cfg.color,
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 7px",
      borderRadius: 5,
      textTransform: "capitalize",
    }}>
      {provider}
    </span>
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

  const [providerHealth, topModels, latencies] = await Promise.all([
    getGatewayProviderHealth(projectId),
    getGatewayTopModels(projectId),
    getGatewayLatencyDistribution(projectId),
  ]);

  const isEmpty = providerHealth.length === 0;

  return (
    <>
      {/* TopBar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 22px", height: 52, flexShrink: 0,
        background: "rgba(13,13,15,0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#f9fafb" }}>Gateway Insights</span>
        </div>
      </div>

      {/* Content */}
      <style>{`
        .insight-hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .insight-hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .insight-hover-row {
          transition: background 0.2s ease;
        }
        .insight-hover-row:hover {
          background-color: rgba(255,255,255,0.02) !important;
        }
      `}</style>
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32 }}>
        
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
            {/* ── Top Row: Performance Metrics ── */}
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(124,58,237,0.15)", color: "#a78bfa", borderRadius: 6 }}>⚡</span>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb" }}>Global Performance</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {[
                  { label: "P50 Latency", value: latencies.p50, color: "#3b82f6" },
                  { label: "P90 Latency", value: latencies.p90, color: "#8b5cf6" },
                  { label: "P99 Latency", value: latencies.p99, color: "#ec4899" }
                ].map((metric, i) => (
                  <div key={i} style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16, padding: "24px",
                    display: "flex", flexDirection: "column",
                    position: "relative", overflow: "hidden",
                    backdropFilter: "blur(12px)",
                  }}>
                    {/* Background glow */}
                    <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: metric.color, opacity: 0.1, filter: "blur(40px)", borderRadius: "50%" }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      {metric.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{
                        fontSize: 42, fontWeight: 800,
                        background: `linear-gradient(to right, #ffffff, ${metric.color})`,
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        lineHeight: 1
                      }}>
                        {metric.value.toFixed(0)}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 600, color: "#6b7280" }}>ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Middle Row: Provider Health ── */}
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(52,211,153,0.15)", color: "#34d399", borderRadius: 6 }}>⛌</span>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb" }}>Provider Health</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                {providerHealth.map((health) => {
                  let statusColor = "#34d399";
                  let statusText = "Healthy";
                  let statusBg = "rgba(52,211,153,0.1)";
                  if (health.serverErrorRate >= 5) {
                    statusColor = "#ef4444";
                    statusText = "Critical";
                    statusBg = "rgba(239,68,68,0.1)";
                  } else if (health.serverErrorRate >= 1) {
                    statusColor = "#f59e0b";
                    statusText = "Degraded";
                    statusBg = "rgba(245,158,11,0.1)";
                  }

                  return (
                    <div key={health.provider} className="insight-hover-card" style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16, padding: "20px",
                      cursor: "default"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <ProviderChip provider={health.provider} />
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: statusBg, padding: "4px 10px", borderRadius: 20, border: `1px solid ${statusColor}40` }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%", background: statusColor,
                            boxShadow: `0 0 8px ${statusColor}`
                          }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {statusText}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>Total Requests</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>{health.totalRequests.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>Avg Latency</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>{Math.round(health.avgLatencyMs)}<span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 2 }}>ms</span></div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>Client Errors</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>{health.clientErrors.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>Provider Errors</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: health.serverErrors > 0 ? "#ef4444" : "#34d399" }}>
                            {health.serverErrors.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Bottom Row: Top Models ── */}
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(236,72,153,0.15)", color: "#ec4899", borderRadius: 6 }}>📊</span>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb" }}>Top Models (Last 7 Days)</h2>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, overflow: "hidden",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["MODEL", "PROVIDER", "REQUESTS", "TOTAL TOKENS", "EST. COST"].map((h) => (
                        <th key={h} style={{
                          padding: "16px 24px", textAlign: "left",
                          fontSize: 11, fontWeight: 600, color: "#9ca3af",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topModels.map((row, i) => {
                      const totalTokens = (row._sum.tokensIn ?? 0) + (row._sum.tokensOut ?? 0);
                      return (
                        <tr key={i} className="insight-hover-row" style={{ 
                          borderBottom: i === topModels.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)",
                        }}>
                          <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>
                            {row.model}
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <ProviderChip provider={row.provider} />
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: 13, color: "#d1d5db" }}>
                            {row._count.id.toLocaleString()}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: 13, color: "#d1d5db" }}>
                            {totalTokens.toLocaleString()}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: 13, color: "#10b981", fontWeight: 700 }}>
                            ${(row._sum.costUsd ?? 0).toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
