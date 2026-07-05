"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderStat {
  provider: string;
  _count: { id: number };
  _sum: { costUsd: number | null };
  _avg: { latencyMs: number | null };
}

interface ProviderBreakdownProps {
  providers: ProviderStat[];
}

// ─── Provider color / label map ───────────────────────────────────────────────

const PROVIDER_META: Record<
  string,
  { color: string; bg: string; border: string; initial: string; label: string }
> = {
  openai: {
    color: "#10a37f",
    bg: "rgba(16,163,127,0.12)",
    border: "rgba(16,163,127,0.25)",
    initial: "O",
    label: "OpenAI",
  },
  anthropic: {
    color: "#cc785c",
    bg: "rgba(204,120,92,0.12)",
    border: "rgba(204,120,92,0.25)",
    initial: "A",
    label: "Anthropic",
  },
  mistral: {
    color: "#ff7000",
    bg: "rgba(255,112,0,0.12)",
    border: "rgba(255,112,0,0.25)",
    initial: "M",
    label: "Mistral",
  },
  google: {
    color: "#4285F4",
    bg: "rgba(66,133,244,0.12)",
    border: "rgba(66,133,244,0.25)",
    initial: "G",
    label: "Google",
  },
  cohere: {
    color: "#39594D",
    bg: "rgba(57,89,77,0.25)",
    border: "rgba(57,89,77,0.4)",
    initial: "C",
    label: "Cohere",
  },
  azure: {
    color: "#0078D4",
    bg: "rgba(0,120,212,0.12)",
    border: "rgba(0,120,212,0.25)",
    initial: "Az",
    label: "Azure",
  },
};

function getProviderMeta(provider: string) {
  const key = provider.toLowerCase();
  return (
    PROVIDER_META[key] ?? {
      color: "#9ca3af",
      bg: "rgba(156,163,175,0.1)",
      border: "rgba(156,163,175,0.2)",
      initial: provider.slice(0, 2).toUpperCase(),
      label: provider.charAt(0).toUpperCase() + provider.slice(1),
    }
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "40px 20px",
      }}
    >
      <span style={{ fontSize: 28, opacity: 0.15 }}>⬡</span>
      <span style={{ fontSize: 12, color: "#4b5563" }}>No provider data yet</span>
      <span style={{ fontSize: 11, color: "#374151", textAlign: "center" }}>
        Provider distribution will appear once you start routing requests
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProviderBreakdown({ providers }: ProviderBreakdownProps) {
  if (!providers || providers.length === 0) {
    return (
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col h-full">
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", marginBottom: 4 }}>
          Provider Breakdown
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 16 }}>
          Request distribution by AI provider
        </div>
        <EmptyState />
      </div>
    );
  }

  const totalRequests = providers.reduce((s, p) => s + p._count.id, 0);

  return (
    <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col gap-[14px] h-full">
      {/* Header */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>Provider Breakdown</div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
          {totalRequests.toLocaleString()} total requests across {providers.length} provider
          {providers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Provider rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {providers.map((p) => {
          const meta = getProviderMeta(p.provider);
          const pct = totalRequests > 0 ? (p._count.id / totalRequests) * 100 : 0;
          const avgLatency = p._avg.latencyMs ?? 0;
          const totalCost = p._sum.costUsd ?? 0;

          return (
            <div key={p.provider}>
              {/* Provider header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: meta.color,
                      flexShrink: 0,
                    }}
                  >
                    {meta.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f9fafb" }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>
                      {p._count.id.toLocaleString()} req · {Math.round(avgLatency)}ms avg
                    </div>
                  </div>
                </div>

                {/* Right stats */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>
                    {pct.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>
                    ${totalCost.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 4,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.05)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})`,
                    borderRadius: 3,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer legend */}
      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
        }}
      >
        {providers.map((p) => {
          const meta = getProviderMeta(p.provider);
          return (
            <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: meta.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 10, color: "#6b7280" }}>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
