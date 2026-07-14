"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowRight,
  Database,
  Shuffle,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const c = {
  bg: "#0A0A0F",
  bgDeep: "#020712",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderStrong: "1px solid rgba(255,255,255,0.12)",
  purple: "#7c5cfc",
  purpleDim: "#5b3fd8",
  purpleFaint: "rgba(124,92,252,0.15)",
  red: "#f87171",
  redFaint: "rgba(248,113,113,0.12)",
  orange: "#fb923c",
  orangeFaint: "rgba(251,146,60,0.10)",
  green: "#4ade80",
  greenFaint: "rgba(74,222,128,0.08)",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
  textDim: "#475569",
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
};

// ─── Comparison Section ────────────────────────────────────────────────────────
const chaosCards = [
  { icon: Ban, color: c.red, bg: c.redFaint, title: "Rate limit exceeded", sub: "OpenAI · 429 Too Many Requests" },
  { icon: AlertTriangle, color: c.orange, bg: c.orangeFaint, title: "Manual fallback failed", sub: "Unhandled exception in retry logic" },
  { icon: TrendingUp, color: c.red, bg: c.redFaint, title: "Unexpected $5,412 bill", sub: "No token budget enforcement" },
  { icon: Zap, color: c.orange, bg: c.orangeFaint, title: "Latency spike: 12.4s", sub: "Cold model, no cache, wrong region" },
];

const pipelineCards = [
  { icon: ArrowRight, label: "Unified API Request", sub: "Single endpoint for all LLM providers", color: c.purple },
  { icon: Database, label: "Semantic Cache Hit", sub: "5ms · 99.2% similarity match", color: c.green },
  { icon: Shuffle, label: "Smart Fallback Router", sub: "Automatic failover across providers", color: c.purple },
];

function ChaosCard({
  card,
  index,
}: {
  card: (typeof chaosCards)[0]
  index: number
}) {
  const offsets = [
    { top: 0, left: 0, rotate: -2 },
    { top: 18, left: 16, rotate: 1.5 },
    { top: 36, left: 8, rotate: -1 },
    { top: 54, left: 20, rotate: 2 },
  ];
  const o = offsets[index];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, rotate: o.rotate - 4 }}
      whileInView={{ opacity: 1, x: 0, rotate: o.rotate }}
      whileHover={{ scale: 1.05, rotate: o.rotate + 3, zIndex: 50, y: -4 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true }}
      style={{
        position: "absolute",
        top: `${o.top + index * 68}px`,
        left: `${o.left}px`,
        right: `${-o.left}px`,
        background: c.surface,
        border: c.border,
        borderLeft: `2px solid ${card.color}`,
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        backdropFilter: "blur(8px)",
        zIndex: index,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.03)`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: card.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <card.icon size={16} color={card.color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: c.textPrimary }}>{card.title}</p>
        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: c.textMuted }}>{card.sub}</p>
      </div>
    </motion.div>
  );
}

function PipelineCard({
  card,
  index,
  total,
}: {
  card: (typeof pipelineCards)[0]
  index: number
  total: number
}) {
  return (
    <div style={{ position: "relative", paddingLeft: 32 }}>
      {index < total - 1 && (
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 52,
            bottom: -24,
            borderLeft: "1px dashed rgba(255,255,255,0.10)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 18,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: card.color === c.green ? c.greenFaint : c.purpleFaint,
          border: `1.5px solid ${card.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: card.color,
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02, x: 5 }}
        transition={{ delay: index * 0.14, duration: 0.5, ease: "easeOut" }}
        viewport={{ once: true }}
        style={{
          background: c.surface,
          border: c.border,
          borderRadius: 10,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: card.color === c.green ? c.greenFaint : c.purpleFaint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <card.icon size={16} color={card.color} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: c.textPrimary }}>{card.label}</p>
          <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: c.textMuted }}>{card.sub}</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function ComparisonSection() {
  return (
    <section id="compare" style={{ background: c.bg, padding: "8rem 1.5rem", overflow: "hidden" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} style={{ textAlign: "center", marginBottom: 72 }}>
          <p className="section-overline" style={{ marginBottom: "1rem", justifyContent: "center" }}>
            Comparison
          </p>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: c.textPrimary,
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            The old way vs.{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${c.purple}, #a78bfa)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              The Aura way
            </span>
          </h2>
        </motion.div>

        {/* Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: 32,
          }}
        >
          {/* ── Without Aura ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            style={{
              background: "rgba(15,8,8,0.8)",
              border: c.border,
              borderRadius: 16,
              padding: "32px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Chaos glow */}
            <div
              style={{
                position: "absolute",
                top: -80,
                right: -60,
                width: 340,
                height: 340,
                background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, rgba(234,88,12,0.08) 40%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c.red,
                    boxShadow: `0 0 8px ${c.red}`,
                  }}
                />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: c.textMuted }}>
                  Without Aura Proxy
                </h3>
              </div>
              <div style={{ position: "relative", height: 340 }}>
                {chaosCards.map((card, i) => (
                  <ChaosCard key={i} card={card} index={i} />
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={14} color={c.red} />
                <p style={{ margin: 0, fontSize: "0.8rem", color: c.red }}>
                  Fragile, undocumented glue code holding everything together
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── With Aura ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            style={{
              background: "rgba(6,4,18,0.8)",
              border: "1px solid rgba(124,92,252,0.15)",
              borderRadius: 16,
              padding: "32px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Clean glow */}
            <div
              style={{
                position: "absolute",
                top: -60,
                left: -40,
                width: 380,
                height: 380,
                background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, rgba(74,222,128,0.05) 50%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c.green,
                    boxShadow: `0 0 8px ${c.green}`,
                  }}
                />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: c.textMuted }}>
                  With Aura Proxy
                </h3>
              </div>

              <div style={{ position: "relative" }}>
                {pipelineCards.map((card, i) => (
                  <PipelineCard key={i} card={card} index={i} total={pipelineCards.length} />
                ))}
              </div>

              {/* Success card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                viewport={{ once: true }}
                style={{
                  background: "linear-gradient(135deg, rgba(74,222,128,0.10), rgba(124,92,252,0.08))",
                  border: "1px solid rgba(74,222,128,0.25)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 0 32px rgba(74,222,128,0.08)",
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(74,222,128,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={20} color={c.green} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: c.green }}>
                    Response Delivered.
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: c.textMuted }}>
                    Zero headaches. 99.99% uptime. Bills stay sane.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
