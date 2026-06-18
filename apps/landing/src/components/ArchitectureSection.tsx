"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Zap, Database, Server, Shield, LineChart, Share2, Globe, Link } from "lucide-react";

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
    id: 1,
    title: "API Gateway",
    subtitle: "Entry Point",
    content: "OpenAI-compatible HTTP endpoint. Drop-in replacement — change one line of code and your app routes through Aura Proxy instantly.",
    icon: Globe,
    relatedIds: [2, 3],
    energy: 100,
    color: "#a78bfa",
  },
  {
    id: 2,
    title: "Semantic Cache",
    subtitle: "pgvector Store",
    content: "Embeddings-based similarity matching at the gateway layer. Queries with 92%+ similarity resolve from cache in under 5ms.",
    icon: Database,
    relatedIds: [1, 4],
    energy: 95,
    color: "#7c5cfc",
  },
  {
    id: 3,
    title: "Smart Router",
    subtitle: "Provider Selection",
    content: "Routes requests to the optimal LLM provider based on cost, latency, and capability. Auto-failover on provider errors.",
    icon: Share2,
    relatedIds: [1, 5],
    energy: 90,
    color: "#818cf8",
  },
  {
    id: 4,
    title: "Vector Store",
    subtitle: "PostgreSQL + pgvector",
    content: "Stores embeddings for all cached responses. Cosine similarity search finds semantically equivalent queries at scale.",
    icon: Server,
    relatedIds: [2],
    energy: 88,
    color: "#6366f1",
  },
  {
    id: 5,
    title: "Provider Pool",
    subtitle: "OpenAI · Anthropic · Gemini",
    content: "Unified interface to all major LLM APIs. Budget caps, rate limits, and fallback chains enforced before any external call.",
    icon: Zap,
    relatedIds: [3, 6],
    energy: 80,
    color: "#5b3fd8",
  },
  {
    id: 6,
    title: "Observability",
    subtitle: "Logs · Traces · Costs",
    content: "Every request logged with latency, cost, cache outcome, and provider. Real-time dashboards and cost breakdowns.",
    icon: LineChart,
    relatedIds: [5, 7],
    energy: 72,
    color: "#34d399",
  },
  {
    id: 7,
    title: "Policy Engine",
    subtitle: "Guardrails · PII · Budgets",
    content: "Content guardrails, PII detection, rate limiting, and spend caps enforced at the gateway — zero application code changes.",
    icon: Shield,
    relatedIds: [6, 1],
    energy: 65,
    color: "#f59e0b",
  },
];

export default function ArchitectureSection() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseIds, setPulseIds] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.3) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, [autoRotate]);

  const getPosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 190;
    const rad = (angle * Math.PI) / 180;
    return {
      x: radius * Math.cos(rad),
      y: radius * Math.sin(rad),
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

  return (
    <section
      id="architecture"
      style={{
        padding: '6rem 1.5rem',
        background: 'var(--aura-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p className="overline" style={{ justifyContent: 'center', marginBottom: '1rem' }}>Architecture</p>
          <h2 style={{
            fontSize: 'var(--text-h1)',
            fontWeight: 800,
            letterSpacing: 'var(--tracking-tight)',
            color: 'var(--aura-text-primary)',
            marginBottom: '1rem',
          }}>
            Every component,{' '}
            <span className="gradient-text">connected.</span>
          </h2>
          <p style={{ color: 'var(--aura-text-muted)', fontSize: 'var(--text-base)', maxWidth: '480px', margin: '0 auto' }}>
            Click any node to explore how Aura Proxy&apos;s components work together.
          </p>
        </div>

        {/* Orbital diagram */}
        <div
          ref={containerRef}
          onClick={handleBgClick}
          style={{
            position: 'relative', width: '100%', height: '560px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div data-orbit-bg style={{ position: 'absolute', inset: 0 }} />

          {/* Orbit rings */}
          {[420, 380].map((size, i) => (
            <div key={size} style={{
              position: 'absolute',
              width: `${size}px`, height: `${size}px`,
              borderRadius: '50%',
              border: i === 0 ? '1px solid rgba(124,92,252,0.12)' : '1px dashed rgba(124,92,252,0.05)',
              pointerEvents: 'none',
            }} />
          ))}

          {/* Center core */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
            {/* Ping rings */}
            {[0, 0.7].map((delay, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: '80px', height: '80px',
                borderRadius: '50%',
                border: '1px solid rgba(124,92,252,0.3)',
                animation: `ping 2s ease-out ${delay}s infinite`,
              }} />
            ))}
            {/* Core */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c5cfc, #5b3fd8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(124,92,252,0.4)',
              animation: 'pulse 3s ease-in-out infinite',
            }}>
              <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
                <path d="M20 4 L34 34 H26 L20 20 L14 34 H6 Z" fill="white" />
                <path d="M12 26 Q20 19 28 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <span style={{
              fontSize: '0.5625rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(167,139,250,0.65)', marginTop: '0.25rem',
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
                  position: 'absolute',
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  zIndex: isExpanded ? 200 : pos.zIndex,
                  opacity: isExpanded ? 1 : pos.opacity,
                  transition: 'opacity 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                {isPulsing && (
                  <div style={{
                    position: 'absolute', inset: '-8px', borderRadius: '50%',
                    border: `1px solid ${node.color}`,
                    animation: 'ping 1.2s ease-out infinite', opacity: 0.6,
                  }} />
                )}

                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: isExpanded ? node.color : 'var(--aura-surface)',
                  border: `2px solid ${isExpanded ? node.color : isPulsing ? node.color : 'rgba(124,92,252,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  transform: isExpanded ? 'scale(1.4)' : 'scale(1)',
                  boxShadow: isExpanded ? `0 0 20px ${node.color}55` : 'none',
                }}>
                  <Icon size={16} color={isExpanded ? 'white' : node.color} />
                </div>

                <div style={{
                  position: 'absolute', top: '52px', left: '50%',
                  transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                  fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.04em',
                  color: isExpanded ? node.color : 'rgba(240,240,244,0.55)',
                  transition: 'color 0.3s', fontFamily: 'var(--font-mono)',
                }}>
                  {node.title}
                </div>

                {isExpanded && (
                  <div style={{
                    position: 'absolute', top: '64px', left: '50%',
                    transform: 'translateX(-50%)', width: '260px',
                    background: 'rgba(13,13,16,0.97)', backdropFilter: 'blur(16px)',
                    border: `1px solid ${node.color}44`,
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${node.color}22`,
                    padding: '1rem 1.125rem', zIndex: 300,
                  }}>
                    <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '8px', background: `${node.color}66` }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                      <span style={{
                        fontSize: '0.625rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em', color: node.color,
                        background: `${node.color}18`, border: `1px solid ${node.color}33`,
                        borderRadius: '999px', padding: '0.15rem 0.5rem',
                      }}>ACTIVE</span>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--aura-text-muted)' }}>
                        {node.subtitle}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--aura-text-primary)', marginBottom: '0.5rem' }}>
                      {node.title}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--aura-text-secondary)', lineHeight: 1.6, marginBottom: '0.875rem' }}>
                      {node.content}
                    </p>

                    {/* Energy bar */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--aura-text-muted)', marginBottom: '0.3rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Zap size={8} /> Load</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{node.energy}%</span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${node.energy}%`, background: `linear-gradient(90deg, ${node.color}, ${node.color}88)`, borderRadius: '999px' }} />
                      </div>
                    </div>

                    {/* Related nodes */}
                    {node.relatedIds.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.375rem' }}>
                          <Link size={9} color="var(--aura-text-muted)" />
                          <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aura-text-muted)', fontFamily: 'var(--font-mono)' }}>Connected</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {node.relatedIds.map((rid) => {
                            const rel = archData.find((n) => n.id === rid);
                            return (
                              <button
                                key={rid}
                                onClick={(e) => { e.stopPropagation(); toggleNode(rid); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                                  fontSize: '0.6875rem', color: rel?.color ?? 'var(--aura-text-secondary)',
                                  background: 'transparent',
                                  border: `1px solid ${(rel?.color ?? 'rgba(255,255,255,0.1)') + '33'}`,
                                  borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem',
                                  cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'background 0.15s',
                                }}
                              >
                                {rel?.title}<ArrowRight size={8} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
