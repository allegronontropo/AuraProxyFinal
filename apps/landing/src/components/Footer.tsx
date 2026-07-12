"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "3rem 1.5rem",
        background: "#020712",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <Image
              src="/AURA_LOGO.png"
              alt="Aura Proxy"
              width={20}
              height={20}
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
            />
          </div>
          <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "1rem" }}>
            Aura<span style={{ color: "#00d2ff" }}>Proxy</span>
          </span>
        </div>

        <p
          style={{
            color: "#334155",
            fontSize: "0.8125rem",
            maxWidth: "420px",
            lineHeight: 1.6,
          }}
        >
          Open-source AI Gateway. Self-hosted semantic caching, routing, and observability for LLM applications.
        </p>

        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "GitHub", href: "https://github.com/allegronontropo/AuraProxyFinal" },
            { label: "Documentation", href: "#" },
            { label: "Docker Hub", href: "#" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{
                fontSize: "0.8rem",
                color: "#475569",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
            >
              {label}
            </a>
          ))}
        </div>

        <div
          style={{
            width: "100%",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: "1.5rem",
            fontSize: "0.75rem",
            color: "#1e293b",
            fontFamily: "var(--font-mono)",
          }}
        >
          © {new Date().getFullYear()} AuraProxy - MIT License
        </div>
      </div>
    </footer>
  );
}
