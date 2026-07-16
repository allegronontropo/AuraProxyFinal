"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Zap, Database, Server, Shield,
  LineChart, Share2, Globe, Link,
} from "lucide-react";

interface ArchNode {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  icon: React.ElementType;
  relatedIds: number[];
  energy: number;
  color: string;
}

const archData: ArchNode[] = [
  {
    id: 1, title: "API Gateway", subtitle: "Entry Point",
    content: "OpenAI-compatible HTTP endpoint. Drop-in replacement - change one line of code and your app routes through Aura Proxy instantly.",
    icon: Globe, relatedIds: [2, 3], energy: 100, color: "#a78bfa",
  },
  {
    id: 2, title: "Semantic Cache", subtitle: "pgvector Store",
    content: "Embeddings-based similarity matching at the gateway layer. Queries with 92%+ similarity resolve from cache in under 5ms.",
    icon: Database, relatedIds: [1, 4], energy: 95, color: "#7c5cfc",
  },
  {
    id: 3, title: "Smart Router", subtitle: "Auto-Failover",
    content: "Configurable fallback chains to route around provider outages. Auto-failover ensures high availability across OpenAI, Anthropic, and Gemini.",
    icon: Share2, relatedIds: [1, 5], energy: 90, color: "#818cf8",
  },
  {
    id: 4, title: "Vector Store", subtitle: "PostgreSQL + pgvector",
    content: "Stores embeddings for all cached responses. Cosine similarity search finds semantically equivalent queries at scale.",
    icon: Server, relatedIds: [2], energy: 88, color: "#6366f1",
  },
  {
    id: 5, title: "Provider Pool", subtitle: "OpenAI · Anthropic · Gemini",
    content: "Unified interface to all major LLM APIs. Budget caps, rate limits, and fallback chains enforced before any external call.",
    icon: Zap, relatedIds: [3, 6], energy: 80, color: "#5b3fd8",
  },
  {
    id: 6, title: "Observability", subtitle: "Logs · Traces · Costs",
    content: "Every request logged with latency, cost, cache outcome, and provider. Real-time dashboards and cost breakdowns.",
    icon: LineChart, relatedIds: [5, 7], energy: 72, color: "#34d399",
  },
  {
    id: 7, title: "Policy Engine", subtitle: "Rate Limits · Budgets",
    content: "Rate limiting and spend caps enforced at the gateway - zero application code changes.",
    icon: Shield, relatedIds: [6, 1], energy: 65, color: "#f59e0b",
  },
];

// Right-panel highlight items (shown when nothing is selected)
const highlights = [
  { color: "#a78bfa", label: "Drop-in compatible", desc: "OpenAI-spec API - zero app code changes" },
  { color: "#7c5cfc", label: "92% cache hit rate", desc: "Semantic similarity via pgvector embeddings" },
  { color: "#34d399", label: "Full observability", desc: "Every request logged, traced, and billed" },
  { color: "#f59e0b", label: "Policy enforcement", desc: "Granular rate limits and budget caps per key" },
];

export default function ArchitectureSection() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseIds, setPulseIds] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.25) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, [autoRotate]);

  const RADIUS = 240; // increased from 190
  const NODE_SIZE = 58; // increased from 44

  const getPosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const rad = (angle * Math.PI) / 180;
    return {
      x: RADIUS * Math.cos(rad),
      y: RADIUS * Math.sin(rad),
      zIndex: Math.round(100 + 50 * Math.cos(rad)),
      opacity: Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(rad)) / 2))),
    };
  };

  const toggleNode = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setAutoRotate(true);
      setPulseIds(new Set());
    } else {
      setExpandedId(id);
      setAutoRotate(false);
      const node = archData.find((n) => n.id === id);
      setPulseIds(new Set(node?.relatedIds ?? []));
    }
  };

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target === containerRef.current || target.dataset.orbitBg !== undefined) {
      setExpandedId(null);
      setAutoRotate(true);
      setPulseIds(new Set());
    }
  };

  const activeNode = archData.find((n) => n.id === expandedId);

  return (
    <section
      id="architecture"
      style={{
        padding: "6rem 1.5rem 7rem",
        background: "var(--aura-bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow left-aligned */}
      <div style={{
        position: "absolute", top: "50%", left: "25%",
        transform: "translate(-50%,-50%)",
        width: "700px", height: "700px",
        background: "radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p className="section-overline" style={{ justifyContent: "center", marginBottom: "1rem" }}>
            Architecture
          </p>
          <h2 style={{
            fontSize: "var(--text-h1)", fontWeight: 800,
            letterSpacing: "var(--tracking-tight)",
            color: "var(--aura-text-primary)", marginBottom: "0.875rem",
          }}>
            Every component,{" "}
            <span className="gradient-text">connected.</span>
          </h2>
          <p style={{ color: "var(--aura-text-muted)", fontSize: "var(--text-base)", maxWidth: "400px", margin: "0 auto" }}>
            Click any node to explore how the components work together.
          </p>
        </div>

        {/* Two-column layout: Orbital LEFT - Description RIGHT */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "3rem",
          flexWrap: "wrap",
        }}>

          {/* ── LEFT: Orbital diagram ── */}
          <div
            ref={containerRef}
            onClick={handleBgClick}
            style={{
              position: "relative",
              flex: "0 0 auto",
              width: "580px",
              height: "580px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div data-orbit-bg style={{ position: "absolute", inset: 0 }} />

            {/* Orbit rings */}
            {[530, 490, 440].map((size, i) => (
              <div key={size} style={{
                position: "absolute",
                width: `${size}px`, height: `${size}px`,
                borderRadius: "50%",
                border: i === 0
                  ? "1px solid rgba(124,92,252,0.08)"
                  : i === 1
                    ? "1px solid rgba(124,92,252,0.12)"
                    : "1px dashed rgba(124,92,252,0.06)",
                pointerEvents: "none",
              }} />
            ))}

            {/* Center core */}
            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
              {/* Ping rings */}
              {[0, 0.8].map((delay, i) => (
                <div key={i} style={{
                  position: "absolute",
                  width: "96px", height: "96px",
                  borderRadius: "50%",
                  border: "1px solid rgba(124,92,252,0.3)",
                  animation: `ping 2.2s ease-out ${delay}s infinite`,
                }} />
              ))}
              {/* Core */}
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "#050507",
                border: "1px solid rgba(124,92,252,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 40px rgba(124,92,252,0.5), inset 0 0 20px rgba(124,92,252,0.15)",
                animation: "pulse 3s ease-in-out infinite",
                overflow: "hidden",
              }}>
                <Image
                  src="/AURA_LOGO.png"
                  alt="Aura Proxy"
                  width={40}
                  height={40}
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                />
              </div>
              <span style={{
                fontSize: "0.5rem", fontFamily: "var(--font-mono)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.15em",
                color: "rgba(167,139,250,0.6)", marginTop: "0.375rem",
              }}>AURA PROXY</span>
            </div>

            {/* Orbit nodes */}
            {archData.map((node, index) => {
              const pos = getPosition(index, archData.length);
              const isExpanded = expandedId === node.id;
              const isPulsing = pulseIds.has(node.id);
              const Icon = node.icon;

              return (
                <div
                  key={node.id}
                  onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                  style={{
                    position: "absolute",
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    zIndex: isExpanded ? 200 : pos.zIndex,
                    opacity: isExpanded ? 1 : pos.opacity,
                    transition: "opacity 0.3s ease",
                    cursor: "pointer",
                  }}
                >
                  {/* Pulse ring */}
                  {isPulsing && (
                    <div style={{
                      position: "absolute",
                      inset: "-10px",
                      borderRadius: "50%",
                      border: `1px solid ${node.color}`,
                      animation: "ping 1.2s ease-out infinite",
                      opacity: 0.6,
                    }} />
                  )}

                  {/* Node circle */}
                  <div style={{
                    width: `${NODE_SIZE}px`, height: `${NODE_SIZE}px`,
                    borderRadius: "50%",
                    background: isExpanded ? node.color : "rgba(13,13,16,0.95)",
                    border: `2px solid ${isExpanded ? node.color : isPulsing ? node.color : `${node.color}50`}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s ease",
                    transform: isExpanded ? "scale(1.35)" : "scale(1)",
                    boxShadow: isExpanded
                      ? `0 0 28px ${node.color}66, 0 0 56px ${node.color}22`
                      : isPulsing
                        ? `0 0 16px ${node.color}44`
                        : "none",
                  }}>
                    <Icon size={20} color={isExpanded ? "white" : node.color} />
                  </div>

                  {/* Label */}
                  <div style={{
                    position: "absolute",
                    top: `${NODE_SIZE + 8}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: isExpanded ? node.color : "rgba(255,255,255,0.75)",
                    transition: "color 0.3s",
                    fontFamily: "var(--font-sans)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    textAlign: "center",
                  }}>
                    {node.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Description panel ── */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            {activeNode ? (
              /* ── Expanded node detail ── */
              <div style={{
                background: "rgba(13,13,16,0.95)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${activeNode.color}33`,
                borderRadius: "var(--radius-xl)",
                padding: "1.75rem",
                boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${activeNode.color}18`,
                transition: "all 0.3s ease",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      background: `${activeNode.color}22`,
                      border: `2px solid ${activeNode.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <activeNode.icon size={20} color={activeNode.color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--aura-text-primary)", marginBottom: "0.2rem" }}>
                        {activeNode.title}
                      </h3>
                      <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--aura-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {activeNode.subtitle}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.5625rem", fontFamily: "var(--font-mono)", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.12em", color: activeNode.color,
                    background: `${activeNode.color}15`, border: `1px solid ${activeNode.color}30`,
                    borderRadius: "999px", padding: "0.2rem 0.625rem",
                  }}>ACTIVE</span>
                </div>

                {/* Description */}
                <p style={{ fontSize: "0.875rem", color: "var(--aura-text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                  {activeNode.content}
                </p>

                {/* Load bar */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--aura-text-muted)", marginBottom: "0.4rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Zap size={10} /> System Load
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", color: activeNode.color, fontWeight: 600 }}>
                      {activeNode.energy}%
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${activeNode.energy}%`,
                      background: `linear-gradient(90deg, ${activeNode.color}, ${activeNode.color}77)`,
                      borderRadius: "999px", transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>

                {/* Connected nodes */}
                {activeNode.relatedIds.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.625rem" }}>
                      <Link size={10} color="var(--aura-text-muted)" />
                      <span style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--aura-text-muted)", fontFamily: "var(--font-mono)" }}>
                        Connected to
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {activeNode.relatedIds.map((rid) => {
                        const rel = archData.find((n) => n.id === rid);
                        return (
                          <button
                            key={rid}
                            onClick={() => toggleNode(rid)}
                            style={{
                              display: "flex", alignItems: "center", gap: "0.35rem",
                              fontSize: "0.75rem", color: rel?.color ?? "var(--aura-text-secondary)",
                              background: `${rel?.color ?? "rgba(255,255,255,0.1)"}12`,
                              border: `1px solid ${(rel?.color ?? "rgba(255,255,255,0.1)") + "30"}`,
                              borderRadius: "var(--radius-md)", padding: "0.35rem 0.75rem",
                              cursor: "pointer", fontFamily: "var(--font-mono)",
                              transition: "all 0.15s", fontWeight: 600,
                            }}
                          >
                            {rel?.title}<ArrowRight size={9} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Close hint */}
                <p style={{ fontSize: "0.625rem", color: "var(--aura-text-muted)", marginTop: "1.25rem", fontFamily: "var(--font-mono)", opacity: 0.6 }}>
                  Click node again or background to deselect
                </p>
              </div>
            ) : (
              /* ── Default: system overview ── */
              <div>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(124,92,252,0.6)", marginBottom: "1.25rem" }}>
                  System Overview
                </p>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--aura-text-primary)", letterSpacing: "var(--tracking-tight)", marginBottom: "0.875rem", lineHeight: 1.2 }}>
                  7 components.<br />
                  <span className="gradient-text">One coherent gateway.</span>
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--aura-text-secondary)", lineHeight: 1.75, marginBottom: "2rem", maxWidth: "36ch" }}>
                  Each component handles a specific concern. Together they give you a production-grade AI gateway without building any of it yourself.
                </p>

                {/* Highlight items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {highlights.map((h) => (
                    <div key={h.label} style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: h.color, flexShrink: 0, marginTop: "6px",
                        boxShadow: `0 0 8px ${h.color}66`,
                      }} />
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--aura-text-primary)", marginBottom: "0.125rem" }}>
                          {h.label}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--aura-text-muted)", lineHeight: 1.5 }}>
                          {h.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: "0.6875rem", color: "var(--aura-text-muted)", marginTop: "2rem", fontFamily: "var(--font-mono)", opacity: 0.5 }}>
                  ← Click any node to explore
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
