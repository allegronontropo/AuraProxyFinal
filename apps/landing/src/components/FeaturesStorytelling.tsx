"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function cx(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(' ');
}

interface FlowSectionProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  'aria-label'?: string;
}

const FlowSection: React.FC<FlowSectionProps> = ({
  className,
  style = {},
  children,
  'aria-label': ariaLabel,
}) => (
  <section
    data-flow-section
    aria-label={ariaLabel}
    className={cx('relative min-h-screen w-full overflow-hidden', className)}
  >
    <div
      data-flow-inner
      className="flow-art-container relative flex min-h-screen w-full flex-col justify-between gap-6 will-change-transform"
      style={{
        transformOrigin: 'bottom left',
        padding: 'clamp(2rem, 8vw, 4rem) clamp(1.5rem, 4vw, 4rem)',
        ...style,
      }}
    >
      {children}
    </div>
  </section>
);

interface FlowArtProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const FlowArt: React.FC<FlowArtProps> = ({
  children,
  className,
  'aria-label': ariaLabel = 'Features storytelling',
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!containerRef.current || reducedMotion) return;

    const sections = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-flow-section]'),
    );
    if (sections.length === 0) return;

    const triggers: ScrollTrigger[] = [];

    sections.forEach((section, i) => {
      gsap.set(section, { zIndex: i + 1 });

      const inner = section.querySelector<HTMLElement>('.flow-art-container');
      if (!inner) return;

      if (i > 0) {
        gsap.set(inner, { rotation: 30, transformOrigin: 'bottom left' });
        const tween = gsap.to(inner, {
          rotation: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 25%',
            scrub: true,
          },
        });
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      }

      if (i < sections.length - 1) {
        triggers.push(
          ScrollTrigger.create({
            trigger: section,
            start: 'bottom bottom',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
          }),
        );
      }
    });

    ScrollTrigger.refresh();

    return () => { triggers.forEach((t) => t.kill()); };
  }, [reducedMotion]);

  return (
    <main
      ref={containerRef}
      aria-label={ariaLabel}
      className={cx('w-full overflow-x-hidden', className)}
    >
      {children}
    </main>
  );
};

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div style={{ minWidth: '160px', flex: 1 }}>
    <p style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
      fontWeight: 800,
      letterSpacing: '-0.03em',
      color: '#a78bfa',
      lineHeight: 1.1,
      marginBottom: '0.375rem',
    }}>{value}</p>
    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{label}</p>
  </div>
);

const SubFeature = ({ label, desc, color = 'rgba(124,92,252,0.8)' }: { label: string; desc: string; color?: string }) => (
  <div style={{ minWidth: '180px', flex: 1 }}>
    <p style={{
      marginBottom: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color,
    }}>{label}</p>
    <p style={{ fontSize: 'clamp(0.8rem, 1.3vw, 0.9375rem)', lineHeight: 1.65, color: 'rgba(255,255,255,0.5)' }}>
      {desc}
    </p>
  </div>
);

const Div = ({ color = 'rgba(255,255,255,0.08)' }: { color?: string }) => (
  <hr style={{ border: 'none', borderTop: `1px solid ${color}`, margin: '0' }} />
);

const SectionNum = ({ num, label, color = 'rgba(124,92,252,0.7)' }: { num: string; label: string; color?: string }) => (
  <p style={{
    fontSize: '0.6875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    fontFamily: 'var(--font-mono)',
    color,
  }}>{num} — {label}</p>
);

const GiantHead = ({ children, color = '#f0f0f4' }: { children: React.ReactNode; color?: string }) => (
  <div>
    <h2 style={{
      fontSize: 'clamp(3.5rem, 12vw, 11rem)',
      fontWeight: 800,
      lineHeight: 0.9,
      letterSpacing: '-0.04em',
      textTransform: 'uppercase',
      color,
    }}>
      {children}
    </h2>
  </div>
);

export default function FeaturesStorytelling() {
  return (
    <section id="features" aria-label="Features">
      <FlowArt aria-label="Aura Proxy features storytelling">

        {/* ── Section 1: The Problem ── */}
        <FlowSection aria-label="The Problem" style={{ background: '#050507' }}>
          <SectionNum num="01" label="The Problem" />
          <Div />
          <GiantHead color="#f0f0f4">
            Every<br />
            Duplicate<br />
            Call Costs<br />
            You.
          </GiantHead>
          <Div />
          <p style={{
            maxWidth: '50ch',
            fontSize: 'clamp(1rem, 2.2vw, 1.375rem)',
            lineHeight: 1.65,
            color: 'rgba(240,240,244,0.5)',
          }}>
            60% of LLM API calls are semantically identical to something you&apos;ve asked before.
            You&apos;re paying $0.03–$0.06 per call — every single time.
          </p>
          <Div />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(1.5rem, 3vw, 3rem)' }}>
            <StatItem value="60%" label="of requests are redundant" />
            <StatItem value="$0.03" label="per GPT-4 call (avg)" />
            <StatItem value="324ms" label="cold API latency" />
          </div>
        </FlowSection>

        {/* ── Section 2: Semantic Cache ── */}
        <FlowSection aria-label="Semantic Cache" style={{ background: '#0d0d10' }}>
          <SectionNum num="02" label="The Solution" color="rgba(167,139,250,0.9)" />
          <Div color="rgba(124,92,252,0.2)" />
          <GiantHead color="#a78bfa">
            Semantic<br />
            Cache.
          </GiantHead>
          <Div color="rgba(124,92,252,0.2)" />
          <p style={{
            maxWidth: '50ch',
            fontSize: 'clamp(1rem, 2.2vw, 1.375rem)',
            lineHeight: 1.65,
            color: 'rgba(167,139,250,0.55)',
          }}>
            Aura Proxy uses pgvector embeddings to match new queries against cached responses
            at 92% semantic similarity. Not just exact matches — intelligent matching.
          </p>
          <Div color="rgba(124,92,252,0.15)" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(1.5rem, 3vw, 3rem)' }}>
            <SubFeature label="92% Hit Rate" desc="Embeddings-based matching via pgvector. Similar questions resolve to the same cached answer." color="#a78bfa" />
            <SubFeature label="5ms Response" desc="Cache hits return in under 5ms. No round-trip to the LLM provider required." color="#a78bfa" />
            <SubFeature label="70% Cost Saved" desc="Each cache hit is a call you don't pay for. Measured across production workloads." color="#a78bfa" />
          </div>
        </FlowSection>

        {/* ── Section 3: Smart Routing ── */}
        <FlowSection aria-label="Smart Routing" style={{ background: '#0a0a0f' }}>
          <SectionNum num="03" label="Smart Routing" color="rgba(129,140,248,0.9)" />
          <Div color="rgba(99,102,241,0.2)" />
          <GiantHead color="#818cf8">
            Route<br />
            To Win.
          </GiantHead>
          <Div color="rgba(99,102,241,0.2)" />
          <p style={{
            maxWidth: '50ch',
            fontSize: 'clamp(1rem, 2.2vw, 1.375rem)',
            lineHeight: 1.65,
            color: 'rgba(129,140,248,0.55)',
          }}>
            Not every request needs GPT-4. Route intelligently by cost, latency, and capability.
            Automatic failover keeps you online when providers go down.
          </p>
          <Div color="rgba(99,102,241,0.15)" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(1.5rem, 3vw, 3rem)' }}>
            <SubFeature label="4+ Providers" desc="OpenAI, Anthropic, Gemini, Mistral — all behind one API endpoint." color="#818cf8" />
            <SubFeature label="Auto-Failover" desc="Provider down? Requests automatically reroute to the next best option." color="#818cf8" />
            <SubFeature label="Budget Caps" desc="Set per-model, per-user, or global spend limits enforced at the gateway." color="#818cf8" />
          </div>
        </FlowSection>

        {/* ── Section 4: Full Control ── */}
        <FlowSection aria-label="Full Control" style={{ background: '#141418' }}>
          <SectionNum num="04" label="Full Control" color="rgba(52,211,153,0.9)" />
          <Div color="rgba(16,185,129,0.2)" />
          <GiantHead color="#34d399">
            Observe.<br />
            Enforce.<br />
            Own It.
          </GiantHead>
          <Div color="rgba(16,185,129,0.2)" />
          <p style={{
            maxWidth: '50ch',
            fontSize: 'clamp(1rem, 2.2vw, 1.375rem)',
            lineHeight: 1.65,
            color: 'rgba(52,211,153,0.55)',
          }}>
            Every request logged, traced, and analyzed. Content guardrails, PII detection,
            and rate limiting — enforced at the gateway. Your infrastructure. Your rules.
          </p>
          <Div color="rgba(16,185,129,0.15)" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(1.5rem, 3vw, 3rem)' }}>
            <SubFeature label="Observability" desc="Real-time logs, latency breakdowns, cost analytics per endpoint, per user, per model." color="#34d399" />
            <SubFeature label="Guardrails" desc="Block toxic content, detect PII, enforce topic restrictions without touching application code." color="#34d399" />
            <SubFeature label="Self-Hosted" desc="Docker Compose. Your API keys stay on your infrastructure. Zero SaaS dependencies." color="#34d399" />
          </div>
        </FlowSection>

      </FlowArt>
    </section>
  );
}
