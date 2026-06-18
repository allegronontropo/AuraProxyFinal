"use client";

const stats = [
  { value: "92%", label: "Cache Hit Rate", suffix: "" },
  { value: "5", label: "Avg Response Time (cached)", suffix: "ms" },
  { value: "60", label: "Cost Reduction", suffix: "%" },
  { value: "4", label: "LLM Providers Supported", suffix: "+" },
];

export default function StatsStrip() {
  return (
    <section
      id="stats"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        padding: "2.5rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
        }}
      >
        {stats.map(({ value, label, suffix }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #a78bfa, #7c5cfc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              {value}
              {suffix}
            </div>
            <div
              style={{
                marginTop: "0.375rem",
                fontSize: "0.8rem",
                color: "#64748b",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
