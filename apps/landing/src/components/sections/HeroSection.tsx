import { useEffect, useRef } from 'react'
import { animateHero, addMagneticEffect } from '../../lib/animations'
import { HERO } from '../../lib/content'

export function HeroSection() {
  const primaryRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    animateHero()
    if (primaryRef.current) addMagneticEffect(primaryRef.current)
  }, [])

  // Split headline — middle line gets gradient
  const [line1, lineGradient, line3] = HERO.headline

  return (
    <section id="hero" className="hero-section" aria-label="Hero">
      {/* Badge */}
      <div data-hero="badge" className="hero-badge" style={{ opacity: 0 }}>
        <span className="badge-dot" aria-hidden="true" />
        <span>{HERO.badge}</span>
      </div>

      {/* Headline */}
      <h1
        data-hero="headline"
        className="hero-headline"
        style={{ opacity: 0 }}
      >
        {line1}{' '}
        <span className="gradient-text">{lineGradient}</span>
        {line3 ? <>{' '}{line3}</> : null}
      </h1>

      {/* Subheadline */}
      <p
        data-hero="sub"
        className="hero-sub"
        style={{ opacity: 0 }}
      >
        {HERO.sub}
      </p>

      {/* CTAs */}
      <div className="hero-ctas" style={{ opacity: 0 }} data-hero="cta">
        <a
          ref={primaryRef}
          href={HERO.cta_primary.href}
          className="btn btn-primary btn-lg"
          id="hero-cta-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          {HERO.cta_primary.label}
          <span className="btn-arrow" aria-hidden="true">→</span>
        </a>
        <a
          href={HERO.cta_secondary.href}
          className="btn btn-ghost btn-lg"
          id="hero-cta-docs"
        >
          {HERO.cta_secondary.label}
        </a>
      </div>

      {/* Hero Visual — proxy flow diagram */}
      <div
        data-hero="visual"
        className="hero-visual"
        style={{ opacity: 0 }}
        aria-hidden="true"
      >
        <div className="hero-visual-frame">
          <div className="hero-visual-topbar">
            <span className="topbar-dot red"   />
            <span className="topbar-dot amber" />
            <span className="topbar-dot green" />
            <span className="topbar-url">localhost:3000/v1/chat/completions</span>
          </div>
          <ProxyFlowDiagram />
        </div>
      </div>
    </section>
  )
}

// ─── Animated proxy flow diagram (SVG) ───────────────────────
function ProxyFlowDiagram() {
  return (
    <div className="proxy-diagram" role="img" aria-label="Aura Proxy data flow diagram">
      {/* Left — App */}
      <div className="diagram-node diagram-node--app">
        <div className="node-icon">{'</>'}</div>
        <div className="node-label">Your App</div>
      </div>

      {/* Arrow → Proxy */}
      <div className="diagram-arrow">
        <div className="arrow-line">
          <div className="arrow-packet" aria-hidden="true" />
        </div>
        <div className="arrow-label">POST /v1/chat/completions</div>
      </div>

      {/* Center — Aura Proxy */}
      <div className="diagram-node diagram-node--proxy">
        <div className="node-icon proxy-glow">◈</div>
        <div className="node-label">Aura Proxy</div>
        <div className="proxy-badges">
          <span className="proxy-badge">Cache</span>
          <span className="proxy-badge">Route</span>
          <span className="proxy-badge">Log</span>
        </div>
      </div>

      {/* Arrow → Providers */}
      <div className="diagram-arrow">
        <div className="arrow-line" />
        <div className="arrow-label">Routed request</div>
      </div>

      {/* Right — Providers */}
      <div className="diagram-providers">
        {[
          { name: 'OpenAI',    color: '#10a37f' },
          { name: 'Anthropic', color: '#d4a574' },
          { name: 'Mistral',   color: '#ff7000' },
          { name: 'Gemini',    color: '#4285f4' },
        ].map((p) => (
          <div key={p.name} className="provider-chip" style={{ '--provider-color': p.color } as React.CSSProperties}>
            <span className="provider-dot" aria-hidden="true" />
            <span>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
