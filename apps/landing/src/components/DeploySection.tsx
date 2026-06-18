"use client";

const dockerCompose = `version: '3.8'
services:
  aura-proxy:
    image: aura-proxy:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=sk-...
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: aura
  redis:
    image: redis:7-alpine`;

export default function DeploySection() {
  return (
    <section id="deploy" style={{ padding: "6rem 1.5rem", background: "rgba(0,0,0,0.2)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "center",
          }}
          className="deploy-grid"
        >
          {/* Left text */}
          <div>
            <span
              style={{
                display: "inline-flex",
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
              Self-Hosted
            </span>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#f1f5f9",
                margin: "0 0 1rem",
                lineHeight: 1.15,
              }}
            >
              Deploy in{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #7c5cfc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                60 Seconds
              </span>
            </h2>
            <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.9375rem" }}>
              Up and running. In one command.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                "Docker Compose — zero dependencies",
                "Your API keys stay on your infrastructure",
                "PostgreSQL + pgvector for semantic cache",
                "Redis for ultra-fast cache lookups",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    fontSize: "0.875rem",
                    color: "#94a3b8",
                  }}
                >
                  <span
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      borderRadius: "50%",
                      background: "rgba(16,185,129,0.15)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                      color: "#10b981",
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com/allegronontropo/AuraProxyFinal"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.75rem",
                background: "linear-gradient(135deg, #7c5cfc, #5b3fd8)",
                color: "white",
                fontWeight: 600,
                fontSize: "0.9rem",
                borderRadius: "0.75rem",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, #8f72fd, #6d50e8)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, #7c5cfc, #5b3fd8)")}
            >
              View on GitHub →
            </a>
          </div>

          {/* Right: Code block */}
          <div
            style={{
              background: "#020712",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            {/* Terminal header */}
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#475569",
                  fontFamily: "var(--font-mono)",
                }}
              >
                docker-compose.yml
              </span>
            </div>
            <pre
              style={{
                margin: 0,
                padding: "1.25rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                lineHeight: 1.7,
                color: "#94a3b8",
                overflowX: "auto",
              }}
            >
              <code>{dockerCompose}</code>
            </pre>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .deploy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
