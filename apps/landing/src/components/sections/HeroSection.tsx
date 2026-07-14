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
        overflow: "hidden",        /* ← kills all horizontal scroll */
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ── Background layers ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.35 }}>
        <HeroWave />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(ellipse 90% 55% at 50% 20%, rgba(5,5,7,0.3) 0%, rgba(5,5,7,0.65) 55%, #050507 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Violet glow anchored to upper-left */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "-60px",
          width: "700px",
          height: "550px",
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(124,92,252,0.16) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Left gradient mask — behind the visual to keep it 100% clear ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background:
            "linear-gradient(90deg, var(--aura-bg) 30%, rgba(5,5,7,0.8) 45%, rgba(5,5,7,0.1) 60%, transparent 80%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Main Layout Wrapper (Grid overlays text & visual perfectly) ── */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          alignItems: "center", // Vertically centers both overlapping elements
          padding: "0 1.5rem",
        }}
      >
        {/* ── AuraHero (Visual) ── */}
        <div
          style={{
            gridArea: "1 / 1",
            justifySelf: "end",
            marginRight: "-40px", // Utilize right-side margin
            width: "860px",
            zIndex: 3,
            pointerEvents: "auto",
            animation: "heroFadeRight 0.85s 0.15s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {/* Scale down to create physical gap between text and visual */}
          <div style={{ transform: "scale(0.85)", transformOrigin: "right center" }}>
            <AuraHero />
          </div>
        </div>

        {/* ── Text content ── */}
        <div
          style={{
            gridArea: "1 / 1",
            zIndex: 4, // Text is always top
            maxWidth: "540px", // Restrict width to guarantee a gap between text and scaled schema
            animation: "heroFadeLeft 0.65s cubic-bezier(0.22,1,0.36,1) both",
            textShadow: "0 4px 24px rgba(5,5,7,0.8)",
          }}
        >


          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(42px, 4.8vw, 76px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.06,
              color: "var(--aura-text-primary)",
              margin: "0 0 1.375rem",
            }}
          >
            One proxy. <span className="gradient-text">Every provider.</span> Zero surprises.
          </h1>

          {/* Subtext */}
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--aura-text-secondary)",
              lineHeight: 1.7,
              maxWidth: "480px",
              margin: "0 0 2.25rem",
            }}
          >
            Aura Proxy is the abstraction layer between your app and every LLM. Route, cache, and control every request from a single endpoint.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "3rem",
            }}
          >
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.8125rem 1.875rem",
                background: "linear-gradient(135deg, #7c5cfc 0%, #5b3fd8 100%)",
                color: "white",
                fontWeight: 600,
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
          zIndex: 5,
        }}
      />
    </section>
  );
}