"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Database,
  Share2,
  LineChart,
  Shield,
  Zap,
  Clock,
  DollarSign,
  Server,
  Eye,
  Lock,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

// ─── Tiny utility ─────────────────────────────────────────────────────────────
function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeatureCard {
  /** Visual accent colour for icon bg, title, border glow */
  color: string;
  /** Softer tint for glassy card background */
  bgTint: string;
  /** Icon component */
  icon: React.ElementType;
  /** Short label shown on the card */
  label: string;
  /** One-liner description on the card */
  stat: string;
  /** Small meta line */
  meta: string;
}

interface Feature {
  id: string;
  tag: string;
  headline: string;
  sub: string;
  image: string;
  accent: string;
  textAccent: string;
  cards: [FeatureCard, FeatureCard, FeatureCard];
}

// ─── Feature Data ─────────────────────────────────────────────────────────────
const features: Feature[] = [
  {
    id: "cache",
    tag: "01 - Semantic Cache",
    headline: "Never pay for\nthe same answer twice.",
    sub: "pgvector embeddings match new queries to cached responses at 92% semantic similarity. Cache hits return in under 5ms - no LLM round-trip.",
    image: "/features/semantic-cache.png",
    accent: "#7c5cfc",
    textAccent: "#a78bfa",
    cards: [
      {
        color: "#5b3fd8",
        bgTint: "rgba(91,63,216,0.12)",
        icon: Database,
        label: "Vector Store",
        stat: "92% hit rate",
        meta: "pgvector · cosine similarity",
      },
      {
        color: "#7c5cfc",
        bgTint: "rgba(124,92,252,0.14)",
        icon: Zap,
        label: "Cache Hit",
        stat: "< 5ms response",
        meta: "No LLM call required",
      },
      {
        color: "#a78bfa",
        bgTint: "rgba(167,139,250,0.16)",
        icon: TrendingDown,
        label: "Cost Impact",
        stat: "−70% spend",
        meta: "Measured on prod workloads",
      },
    ],
  },
  {
    id: "routing",
    tag: "02 - Smart Routing",
    headline: "Route every request\nto the winning model.",
    sub: "Dynamic routing across OpenAI, Anthropic, Gemini, and Mistral. Automatic failover, budget caps, and per-model latency scoring - enforced at the gateway.",
    image: "/features/smart-routing.png",
    accent: "#818cf8",
    textAccent: "#a5b4fc",
    cards: [
      {
        color: "#4f46e5",
        bgTint: "rgba(79,70,229,0.12)",
        icon: Share2,
        label: "4+ Providers",
        stat: "One endpoint",
        meta: "OpenAI · Anthropic · Gemini · Mistral",
      },
      {
        color: "#6366f1",
        bgTint: "rgba(99,102,241,0.14)",
        icon: AlertTriangle,
        label: "Auto-Failover",
        stat: "0 downtime",
        meta: "Provider failover in < 200ms",
      },
      {
        color: "#818cf8",
        bgTint: "rgba(129,140,248,0.16)",
        icon: DollarSign,
        label: "Budget Caps",
        stat: "Enforced",
        meta: "Per-model · per-user · global",
      },
    ],
  },
  {
    id: "observability",
    tag: "03 - Observability",
    headline: "See everything.\nBill precisely.",
    sub: "Every request logged with latency, cost, cache outcome, and provider. Real-time dashboards, cost breakdowns per endpoint, and structured trace export.",
    image: "/features/observability.png",
    accent: "#34d399",
    textAccent: "#6ee7b7",
    cards: [
      {
        color: "#059669",
        bgTint: "rgba(5,150,105,0.12)",
        icon: Eye,
        label: "Request Logs",
        stat: "100% captured",
        meta: "Latency · cost · provider · outcome",
      },
      {
        color: "#10b981",
        bgTint: "rgba(16,185,129,0.14)",
        icon: LineChart,
        label: "Analytics",
        stat: "Real-time",
        meta: "Cost per endpoint · per user",
      },
      {
        color: "#34d399",
        bgTint: "rgba(52,211,153,0.16)",
        icon: Server,
        label: "Trace Export",
        stat: "OpenTelemetry",
        meta: "Plug into Grafana · Datadog",
      },
    ],
  },
  {
    id: "policy",
    tag: "04 - Policy Engine",
    headline: "Your rules.\nYour infrastructure.",
    sub: "Content guardrails, PII detection, rate limiting, and spend caps enforced at the gateway layer - without touching a single line of application code.",
    image: "/features/policy-engine.png",
    accent: "#f59e0b",
    textAccent: "#fcd34d",
    cards: [
      {
        color: "#b45309",
        bgTint: "rgba(180,83,9,0.12)",
        icon: Shield,
        label: "Guardrails",
        stat: "Enforced",
        meta: "Toxicity · topic restriction",
      },
      {
        color: "#d97706",
        bgTint: "rgba(217,119,6,0.14)",
        icon: Lock,
        label: "PII Detection",
        stat: "Auto-redact",
        meta: "Email · phone · SSN · credit card",
      },
      {
        color: "#f59e0b",
        bgTint: "rgba(245,158,11,0.16)",
        icon: Clock,
        label: "Rate Limiting",
        stat: "Per-key",
        meta: "Global · per-user · per-model",
      },
    ],
  },
];

// ─── Single DisplayCard ────────────────────────────────────────────────────────
interface DisplayCardProps extends FeatureCard {
  className?: string;
  style?: React.CSSProperties;
}

function DisplayCard({
  className,
  style,
  color,
  bgTint,
  icon: Icon,
  label,
  stat,
  meta,
}: DisplayCardProps) {
  return (
    <div
      className={cx(
        // grid-area stacking
        "[grid-area:stack]",
        // base shape
        "relative flex h-36 w-[22rem] select-none flex-col justify-between",
        "rounded-2xl border px-5 py-4 backdrop-blur-md",
        "-skew-y-[8deg]",
        // fade-out gradient on right edge (mirrors the 21dev trick)
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-48",
        "after:bg-gradient-to-l after:from-[#050507] after:to-transparent after:content-['']",
        // transitions
        "transition-all duration-700",
        className
      )}
      style={{
        background: bgTint,
        borderColor: `${color}40`,
        boxShadow: `0 0 0 1px ${color}20, 0 4px 24px rgba(0,0,0,0.5)`,
        ...style,
      }}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex items-center justify-center rounded-full p-1.5"
          style={{ background: `${color}25`, border: `1px solid ${color}40` }}
        >
          <Icon size={14} style={{ color }} />
        </span>
        <p
          className="text-sm font-semibold tracking-tight"
          style={{ color }}
        >
          {label}
        </p>
      </div>

      {/* Stat */}
      <p
        className="font-mono text-xl font-bold tracking-tight"
        style={{ color: "rgba(240,240,244,0.92)" }}
      >
        {stat}
      </p>

      {/* Meta */}
      <p
        className="font-mono text-[10px] tracking-wide uppercase"
        style={{ color: "rgba(240,240,244,0.3)" }}
      >
        {meta}
      </p>
    </div>
  );
}

// ─── Stacked display cards ─────────────────────────────────────────────────────
function FeatureCardStack({ feature }: { feature: Feature }) {
  const [c0, c1, c2] = feature.cards;
  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center">
      {/* Back card - greyed, lifts on hover */}
      <DisplayCard
        {...c0}
        className={cx(
          "[grid-area:stack]",
          "grayscale hover:grayscale-0",
          "hover:-translate-y-10",
          // dim overlay that fades on hover
          "before:absolute before:inset-0 before:rounded-2xl before:bg-background/50 before:transition-opacity before:duration-700 hover:before:opacity-0",
        )}
      />

      {/* Middle card */}
      <DisplayCard
        {...c1}
        className={cx(
          "[grid-area:stack]",
          "translate-x-16 translate-y-10",
          "grayscale hover:grayscale-0",
          "hover:-translate-y-1",
          "before:absolute before:inset-0 before:rounded-2xl before:bg-background/50 before:transition-opacity before:duration-700 hover:before:opacity-0",
        )}
      />

      {/* Front card - always coloured */}
      <DisplayCard
        {...c2}
        className="[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10"
      />
    </div>
  );
}

// ─── Single feature block ──────────────────────────────────────────────────────
function FeatureBlock({ feature, reversed }: { feature: Feature; reversed?: boolean }) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={blockRef}
      className={cx(
        "relative flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20",
        reversed && "lg:flex-row-reverse",
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {/* ── Left / Right: Text + Cards ── */}
      <div className="flex flex-col gap-8 lg:w-[44%]">
        {/* Tag */}
        <p
          className="font-mono text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: `${feature.textAccent}99` }}
        >
          {feature.tag}
        </p>

        {/* Headline */}
        <h3
          className="text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-5xl"
          style={{
            color: "var(--aura-text-primary)",
            whiteSpace: "pre-line",
          }}
        >
          {feature.headline.split("\n").map((line, i) =>
            i === 1 ? (
              <span key={i} style={{ color: feature.textAccent }}>
                {line}
              </span>
            ) : (
              <React.Fragment key={i}>{line}{"\n"}</React.Fragment>
            )
          )}
        </h3>

        {/* Sub */}
        <p
          className="text-base leading-relaxed"
          style={{ color: "var(--aura-text-secondary)", maxWidth: "44ch" }}
        >
          {feature.sub}
        </p>

        {/* Stacked cards */}
        <div className="pt-4">
          <FeatureCardStack feature={feature} />
        </div>
      </div>

      {/* ── Right / Left: Illustration ── */}
      <div className="relative lg:w-[56%]">
        {/* Glow blob behind image */}
        <div
          className="absolute inset-0 rounded-3xl blur-3xl opacity-20"
          style={{ background: `radial-gradient(ellipse at 50% 50%, ${feature.accent}, transparent 70%)` }}
        />

        {/* Image frame */}
        <div
          className="relative overflow-hidden rounded-2xl border"
          style={{
            borderColor: `${feature.accent}30`,
            boxShadow: `0 0 0 1px ${feature.accent}15, 0 24px 64px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 40%, ${feature.accent}08 50%, transparent 60%)`,
              animation: "shimmer 4s ease-in-out infinite",
            }}
          />

          <Image
            src={feature.image}
            alt={feature.tag}
            width={1200}
            height={675}
            className="w-full object-cover"
            style={{ display: "block" }}
          />

          {/* Bottom fade into page bg */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: "linear-gradient(to top, #050507 0%, transparent 100%)",
            }}
          />

          {/* Accent top-left corner bar */}
          <div
            className="absolute top-0 left-0 h-0.5 w-24"
            style={{ background: `linear-gradient(90deg, ${feature.accent}, transparent)` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FeaturesV3() {
  return (
    <section
      id="features"
      style={{
        background: "var(--aura-bg)",
        padding: "6rem 1.5rem 8rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Faint grid texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,92,252,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
        {/* ── Section Header ── */}
        <div className="text-center mb-16 lg:mb-24">
          <p className="section-overline" style={{ justifyContent: "center", marginBottom: "1rem" }}>
            Features
          </p>
          <h2
            className="mx-auto"
            style={{
              fontSize: "var(--text-h1)",
              fontWeight: 800,
              letterSpacing: "var(--tracking-tight)",
              color: "var(--aura-text-primary)",
              maxWidth: "680px",
              marginBottom: "1.25rem",
            }}
          >
            Everything your AI stack{" "}
            <span className="gradient-text">needs at the edge.</span>
          </h2>
          <p
            style={{
              color: "var(--aura-text-muted)",
              fontSize: "var(--text-base)",
              maxWidth: "540px",
              margin: "0 auto",
              lineHeight: 1.75,
            }}
          >
            One gateway. Four pillars. Zero changes to your existing application code.
          </p>
        </div>

        {/* ── Feature Blocks ── */}
        <div className="flex flex-col gap-32 lg:gap-40">
          {features.map((f, i) => (
            <React.Fragment key={f.id}>
              <FeatureBlock feature={f} reversed={i % 2 === 1} />

              {/* Divider between blocks */}
              {i < features.length - 1 && (
                <div
                  className="section-divider"
                  style={{ opacity: 0.5 }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
