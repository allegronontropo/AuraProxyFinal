"use client";

const rows = [
  { feature: "Semantic Cache", aura: true, manual: false, saas: "Partial" },
  { feature: "Multi-Provider Routing", aura: true, manual: false, saas: true },
  { feature: "Self-Hosted", aura: true, manual: true, saas: false },
  { feature: "Full Observability", aura: true, manual: false, saas: "Limited" },
  { feature: "Policy Engine", aura: true, manual: false, saas: "Partial" },
  { feature: "OpenAI Compatible API", aura: true, manual: false, saas: true },
  { feature: "Zero Vendor Lock-in", aura: true, manual: true, saas: false },
  { feature: "Budget Guardrails", aura: true, manual: false, saas: "Paid" },
];

const Cell = ({ val }: { val: boolean | string }) => {
  if (val === true)
    return (
      <span
        style={{
          display: "inline-flex",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "50%",
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.3)",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.6rem",
          color: "#10b981",
        }}
      >
        ✓
      </span>
    );
  if (val === false)
    return (
      <span
        style={{
          display: "inline-flex",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "50%",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.6rem",
          color: "#ef4444",
        }}
      >
        ✗
      </span>
    );
  return (
    <span
      style={{
        fontSize: "0.75rem",
        color: "#64748b",
        fontFamily: "var(--font-mono)",
      }}
    >
      {val}
    </span>
  );
};

export default function ComparisonSection() {
  return (
    <section id="comparison" style={{ padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f1f5f9",
              margin: "0 0 1rem",
            }}
          >
            How Aura Proxy{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #7c5cfc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              compares
            </span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>
            vs. rolling your own vs. paying for a SaaS gateway
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "1rem",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th
                  style={{
                    padding: "1rem 1.25rem",
                    textAlign: "left",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-mono)",
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 500,
                  }}
                >
                  Feature
                </th>
                {[
                  { label: "Aura Proxy", highlight: true },
                  { label: "Manual", highlight: false },
                  { label: "SaaS Gateway", highlight: false },
                ].map(({ label, highlight }) => (
                  <th
                    key={label}
                    style={{
                      padding: "1rem 1.25rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-mono)",
                      color: highlight ? "#00d2ff" : "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: highlight ? 700 : 500,
                      background: highlight ? "rgba(0,114,255,0.05)" : "transparent",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  style={{
                    borderBottom:
                      i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  }}
                >
                  <td
                    style={{
                      padding: "0.875rem 1.25rem",
                      fontSize: "0.875rem",
                      color: "#94a3b8",
                    }}
                  >
                    {row.feature}
                  </td>
                  <td
                    style={{
                      padding: "0.875rem 1.25rem",
                      textAlign: "center",
                      background: "rgba(0,114,255,0.04)",
                    }}
                  >
                    <Cell val={row.aura} />
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "center" }}>
                    <Cell val={row.manual} />
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", textAlign: "center" }}>
                    <Cell val={row.saas} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
