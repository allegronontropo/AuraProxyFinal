"use client";

const features = [
  {
    icon: "⚡",
    title: "Semantic Cache",
    description: "Embeddings-based similarity matching. Queries like 'What is the capital of France?' and 'France capital?' resolve to the same cached response.",
    badge: "92% hit rate",
    color: "#0072ff",
  },
  {
    icon: "🔀",
    title: "Smart Routing",
    description: "Route requests to the optimal provider based on cost, latency, and capability. Automatic failover keeps you online 24/7.",
    badge: "4+ providers",
    color: "#7c3aed",
  },
  {
    icon: "📊",
    title: "Full Observability",
    description: "Every request logged, traced, and analyzed. Cost breakdowns per model, per endpoint, per user. Know exactly what you're paying for.",
    badge: "Real-time",
    color: "#0891b2",
  },
  {
    icon: "🛡️",
    title: "Policy Engine",
    description: "Rate limiting, budget caps, content guardrails, and PII detection at the gateway layer. Enforce rules without changing your application code.",
    badge: "Zero trust",
    color: "#059669",
  },
  {
    icon: "🐳",
    title: "Self-Hosted",
    description: "Deploy on your own infrastructure in 60 seconds with Docker Compose. Your API keys never leave your environment.",
    badge: "Docker ready",
    color: "#d97706",
  },
  {
    icon: "🔌",
    title: "Drop-in Compatible",
    description: "OpenAI-compatible API. Change one line of code — your base URL — and your application is instantly routed through Aura Proxy.",
    badge: "No migration",
    color: "#dc2626",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid rgba(0,114,255,0.3)",
              color: "#00d2ff",
              background: "rgba(0,114,255,0.08)",
              marginBottom: "1.5rem",
            }}
          >
            Everything you need
          </span>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f1f5f9",
              margin: "0 0 1rem",
            }}
          >
            One gateway.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00d2ff, #0072ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              All providers.
            </span>
          </h2>
          <p
            style={{
              maxWidth: "520px",
              margin: "0 auto",
              color: "#64748b",
              fontSize: "1.0625rem",
              lineHeight: 1.7,
            }}
          >
            Aura Proxy sits between your application and every LLM API. Intelligent, observable, and self-hosted.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "1rem",
                padding: "1.75rem",
                transition: "border-color 0.2s, background 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = `${f.color}33`;
                el.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(255,255,255,0.06)";
                el.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              {/* Top accent line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "1.75rem",
                  width: "2.5rem",
                  height: "2px",
                  background: f.color,
                  borderRadius: "0 0 2px 2px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <span style={{ fontSize: "1.75rem" }}>{f.icon}</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    color: f.color,
                    background: `${f.color}15`,
                    border: `1px solid ${f.color}33`,
                    borderRadius: "999px",
                    padding: "0.2rem 0.6rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {f.badge}
                </span>
              </div>

              <h3
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "#f1f5f9",
                  margin: "0 0 0.625rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
