"use client";

import HeroWave from "@/components/animations/HeroWave";
import AuraHero from "@/components/animations/AuraHero";

export default function HeroSection() {
  return (
    <section
      id="hero"
      style={{
        position: "relative",
        background: "var(--aura-bg)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // NO overflow:hidden - let the visual breathe
      }}
    >
      {/* Dynamic Wave Canvas - full background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          opacity: 0.4,
        }}
      >
        <HeroWave />
      </div>

      {/* Radial overlay - blends wave into bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(ellipse 90% 55% at 50% 20%, rgba(5,5,7,0.35) 0%, rgba(5,5,7,0.7) 55%, #050507 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient violet glow from top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(124,92,252,0.16) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "7rem",
          paddingBottom: "4rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          gap: "3rem",
        }}
      >
        {/* ── HERO TEXT ── */}
        <div
          style={{
            textAlign: "center",
            maxWidth: "860px",
            animation: "fadeInUp 0.7s var(--ease-out) both",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.6875rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.3rem 0.875rem",
              borderRadius: "999px",
              border: "1px solid rgba(124,92,252,0.35)",
              color: "#a78bfa",
              background: "rgba(124,92,252,0.08)",
              marginBottom: "2rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            Open-source AI Gateway · Self-hosted
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "var(--text-hero)",
              fontWeight: 800,
              letterSpacing: "var(--tracking-tight)",
              lineHeight: 1.05,
              color: "var(--aura-text-primary)",
              margin: "0 0 1.25rem",
            }}
          >
            Stop paying for the{" "}
            <span className="gradient-text">same AI request</span>{" "}
            twice.
          </h1>

          {/* Sub */}
          <p
            style={{
              fontSize: "var(--text-xl)",
              color: "var(--aura-text-secondary)",
              lineHeight: 1.7,
              maxWidth: "560px",
              margin: "0 auto 2.25rem",
            }}
          >
            Semantic caching, intelligent routing, full observability.
            One intelligent layer between your app and any LLM.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              gap: "0.875rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="http://localhost:3001"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.8125rem 1.875rem",
                background: "linear-gradient(135deg, #7c5cfc 0%, #5b3fd8 100%)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                transition: "all 0.22s",
                boxShadow: "0 4px 24px rgba(124,92,252,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,92,252,0.5)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(124,92,252,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Start Building →
            </a>
            <a
              href="https://github.com/allegronontropo/AuraProxyFinal"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.8125rem 1.875rem",
                background: "rgba(255,255,255,0.04)",
                color: "var(--aura-text-secondary)",
                fontWeight: 600,
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                border: "1px solid var(--aura-border)",
                transition: "all 0.22s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(124,92,252,0.4)";
                e.currentTarget.style.color = "var(--aura-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--aura-border)";
                e.currentTarget.style.color = "var(--aura-text-secondary)";
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* ── ARCHITECTURE VISUAL - direct, no scroll wrapper ── */}
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            animation: "fadeInUp 0.9s 0.15s var(--ease-out) both",
          }}
        >
          <AuraHero />
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: "linear-gradient(to top, var(--aura-bg), transparent)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
