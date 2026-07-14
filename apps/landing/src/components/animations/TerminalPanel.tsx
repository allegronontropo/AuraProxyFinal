"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const METRICS = [
  { label: "Cache Hit", value: "15ms", delta: null },
  { label: "Saved", value: "$1,240", delta: "this month" },
  { label: "Provider", value: "OpenAI → Anthropic", delta: "fallback" },
];

export default function TerminalPanel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setVisible(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: "480px",
      }}
    >
      <div
        style={{
          background: "rgba(13,13,20,0.88)",
          border: "1px solid rgba(124,77,255,0.16)",
          borderRadius: 12,
          backdropFilter: "blur(28px)",
          boxShadow: "0 0 40px rgba(124,77,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
          padding: 16,
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: 12,
          color: "#e4e4e7",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ color: "#94a3b8", fontSize: 11, letterSpacing: "0.1em" }}>
            terminal.auproxy.local
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <span style={{ color: "#22c55e" }}>cache</span>
            <span style={{ color: "#94a3b8" }}>&#62;</span>
            <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>
              <span style={{ color: "#a78bfa" }}>proxy.init()</span>
            </code>
          </div>
          <div style={{ fontSize: 11, color: "#868e96", marginBottom: 4 }}>
            <span style={{ color: "#94a3b8" }}>✓</span> Connected to proxy
          </div>
          <div style={{ fontSize: 11, color: "#868e96" }}>
            <span style={{ color: "#94a3b8" }}>✓</span> Route configured
          </div>
        </div>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}>
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "10px 12px",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{metric.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f4" }}>{metric.value}</div>
              {metric.delta && (
                <div style={{ fontSize: 10, color: "#22c55e", marginTop: 2 }}>
                  {metric.delta}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </motion.div>
  );
}