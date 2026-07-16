"use client";

import { motion } from "motion/react";

const stats = [
  { value: "91", suffix: "%", label: "Cache Hit Rate" },
  { value: "7", suffix: "ms", label: "Local Cache Hit Latency" },
  { value: "60", suffix: "%", label: "Cost Reduction" },
  { value: "4", suffix: "+", label: "LLM Providers Supported" },
];

export default function StatsStrip() {
  return (
    <section id="stats" style={{ padding: "2.5rem 1.5rem", position: "relative", zIndex: 10 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "32px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "3.5rem 2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "3rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {stats.map(({ value, label, suffix }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: "2px",
              }}
            >
              {value}
              <span style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                background: "linear-gradient(130deg, #7C5CFC 0%, #B18CFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                {suffix}
              </span>
            </div>
            <div
              style={{
                marginTop: "1rem",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
