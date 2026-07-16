"use client";
import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const P   = "#7C5CFC";
const PL  = "#B18CFF";
const G   = "#23D18B";
const A   = "#FFB547";
const R   = "#FF5A6B";
const C   = "#22D3EE";
const DIV = "1px solid rgba(255,255,255,0.05)";

const sparkData = [
  { v: 35 }, { v: 52 }, { v: 44 }, { v: 68 }, { v: 62 },
  { v: 74 }, { v: 79 }, { v: 83 }, { v: 87 }, { v: 92 },
];

// ─── Shared Primitives ────────────────────────────────────────────────────────

function Card({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "rgba(255,255,255,0.01)",
        ...style,
      }}
    >
      {/* purple glow on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          background: "radial-gradient(circle at 50% 0%, rgba(124,92,252,0.1) 0%, transparent 70%)",
          boxShadow: `inset 0 0 0 1px rgba(124,92,252,0.45)`,
        }}
      />
      {children}
    </motion.div>
  );
}

function Eyebrow({
  children,
  color,
  gradient,
}: {
  children: React.ReactNode;
  color?: string;
  gradient?: string;
}) {
  const isCustom = color || gradient;
  return (
    <p style={{
      fontSize: "10px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginBottom: "8px",
      fontWeight: isCustom ? 700 : 500,
      color: gradient ? "transparent" : (color || "rgba(255,255,255,0.3)"),
      backgroundImage: gradient,
      backgroundClip: gradient ? "text" : undefined,
      WebkitBackgroundClip: gradient ? "text" : undefined,
      WebkitTextFillColor: gradient ? "transparent" : undefined,
    }}>
      {children}
    </p>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: "17px",
      fontWeight: 600,
      color: "#ffffff",
      lineHeight: 1.25,
      marginBottom: "6px",
    }}>
      {children}
    </h3>
  );
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "13px",
      lineHeight: 1.7,
      color: "rgba(255,255,255,0.48)",
    }}>
      {children}
    </p>
  );
}

function FieldBox({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: "8px",
      fontSize: "13px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.09)",
      color: "rgba(255,255,255,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Card: Smart Fallback Routing ─────────────────────────────────────────────

function FallbackCard() {
  const chain = [
    { n: 1, model: "claude-3-5-sonnet-20241022" },
    { n: 2, model: "gpt-4o" },
  ];

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box" }}>
      <div>
        <Eyebrow color={PL}>Routing</Eyebrow>
        <CardTitle>Smart Fallback Routing</CardTitle>
        <CardDesc>
          Automatic provider failover keeps your apps resilient when rate limits or outages hit.
        </CardDesc>
      </div>

      <div>
        <Eyebrow>Add a Fallback Model</Eyebrow>
        <div style={{ display: "flex", gap: "8px" }}>
          <FieldBox style={{ flex: 1 }}>
            <span>Gemini 2.5 Pro (Google)</span>
            <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
          </FieldBox>
          <button style={{
            padding: "0 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.65)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}>
            Add
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <Eyebrow>Fallback Chain (in order of priority)</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {chain.map(({ n, model }) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: n * 0.12 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <ChevronUp size={9} style={{ color: "rgba(255,255,255,0.25)" }} />
                  <ChevronDown size={9} style={{ color: "rgba(255,255,255,0.25)" }} />
                </div>
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                  background: "rgba(124,92,252,0.2)",
                  color: P,
                  flexShrink: 0,
                }}>
                  #{n}
                </div>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.72)" }}>
                  {model}
                </span>
              </div>
              <button style={{ fontSize: "11px", color: R, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Remove
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Card: Semantic Cache ─────────────────────────────────────────────────────

function CacheCard() {
  const rows = [
    { label: "Exact hits",              value: "50",   color: G },
    { label: "Semantic hits",           value: "13",   color: P },
    { label: "Avg semantic similarity", value: "0.98", color: "rgba(255,255,255,0.82)" },
    { label: "Edge cache latency",      value: "84ms", color: C },
  ];

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <Eyebrow gradient={`linear-gradient(135deg, ${C}, ${P})`}>Cache</Eyebrow>
          <CardTitle>Semantic Cache</CardTitle>
          <CardDesc>
            Skip redundant model calls entirely. Serve cached results in under 25ms at zero cost.
          </CardDesc>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontSize: "52px",
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            background: `linear-gradient(135deg, ${P}, ${PL})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            90.99%
          </div>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", color: "rgba(255,255,255,0.3)" }}>
            Hit Rate
          </div>
        </div>
      </div>

      <div style={{ height: "64px", flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P} stopOpacity={0.4} />
                <stop offset="100%" stopColor={P} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={P} strokeWidth={2} fill="url(#sparkGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ flex: 1 }}>
        <Eyebrow>Hit Type Breakdown</Eyebrow>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.52)" }}>{r.label}</span>
              <span style={{ fontSize: "14px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Card: Request Logs ───────────────────────────────────────────────────────

function DetailRow({ items, cols }: { items: { k: string; v: string }[]; cols: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      {items.map(({ k, v }, i) => (
        <div key={k} style={{
          padding: "12px 16px",
          borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
        }}>
          <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", color: "rgba(255,255,255,0.26)" }}>{k}</p>
          <p style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.63)" }}>{v}</p>
        </div>
      ))}
    </div>
  );
}

function LogsCard() {
  const logs = [
    { t: "15m ago", model: "llama-3.1-8b-instant", tokens: "45 / 12",   latency: "87ms",   cache: "HIT",  s: 200 },
    { t: "15m ago", model: "llama-3.1-8b-instant", tokens: "45 / 12",   latency: "112ms",  cache: "HIT",  s: 200 },
    { t: "18m ago", model: "gpt-4o",               tokens: "612 / 180", latency: "842ms", cache: "MISS", s: 200 },
    { t: "22m ago", model: "claude-3-5-sonnet",    tokens: "1452 / 390",latency: "261ms", cache: "MISS", s: 200 },
  ];
  const filters = ["All Providers", "OpenAI", "Anthropic", "Mistral", "Groq"];
  const cols = "72px 1fr 80px 62px 46px 50px";

  return (
    <div style={{ padding: "20px", height: "100%", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }}>
      <div>
        <Eyebrow color={G}>Observability</Eyebrow>
        <CardTitle>Request Logs</CardTitle>
        <CardDesc>
          Unified log stream across every provider. Filter by model, status, or cache behavior.
        </CardDesc>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {filters.map((f, i) => (
          <span key={f} style={{
            padding: "4px 10px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: 500,
            cursor: "pointer",
            background: i === 0 ? "rgba(124,92,252,0.18)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${i === 0 ? "rgba(124,92,252,0.38)" : "rgba(255,255,255,0.08)"}`,
            color: i === 0 ? PL : "rgba(255,255,255,0.42)",
          }}>
            {f}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: cols,
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          paddingBottom: "8px",
          marginBottom: "4px",
          color: "rgba(255,255,255,0.26)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span>Time</span>
          <span>Model</span>
          <span>Tokens</span>
          <span>Latency</span>
          <span>Cache</span>
          <span>Status</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                alignItems: "center",
                padding: "10px 4px",
                borderRadius: "6px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)" }}>{log.t}</span>
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: P, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "12px" }}>{log.model}</span>
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.44)" }}>{log.tokens}</span>
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.56)" }}>{log.latency}</span>
              <span style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                textAlign: "center",
                background: log.cache === "HIT" ? "rgba(35,209,139,0.12)" : "rgba(255,255,255,0.05)",
                color: log.cache === "HIT" ? G : "rgba(255,255,255,0.3)",
              }}>
                {log.cache}
              </span>
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: G }}>● {log.s}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Card: API Key Management ─────────────────────────────────────────────────

function KeyCard() {
  const perms = [
    { name: "Chat Generation (Write)", on: true },
    { name: "Read Models",             on: true },
    { name: "Read Cache",              on: false },
    { name: "Read Logs",               on: false },
  ];

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }}>
      <div>
        <Eyebrow color={R}>Access Control</Eyebrow>
        <CardTitle>API Key Management</CardTitle>
        <CardDesc>
          Issue scoped keys with per-key rate limits and granular permission controls.
        </CardDesc>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <Eyebrow>Key Name</Eyebrow>
          <FieldBox>Aura Proxy</FieldBox>
        </div>
        <div>
          <Eyebrow>Rate Limit (req/min)</Eyebrow>
          <FieldBox>
            <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.78)" }}>60</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <ChevronUp size={10} style={{ color: "rgba(255,255,255,0.28)" }} />
              <ChevronDown size={10} style={{ color: "rgba(255,255,255,0.28)" }} />
            </div>
          </FieldBox>
        </div>
        <div>
          <Eyebrow>Permissions</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {perms.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: p.on ? "rgba(124,92,252,0.22)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${p.on ? "rgba(124,92,252,0.52)" : "rgba(255,255,255,0.1)"}`,
                }}>
                  {p.on && (
                    <span style={{ color: P, fontSize: 9, fontWeight: 800, lineHeight: 1 }}>✓</span>
                  )}
                </div>
                <span style={{ fontSize: "12px", color: p.on ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.36)" }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "4px" }}>
        <button style={{
          padding: "8px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.42)",
          border: "none",
          cursor: "pointer",
        }}>
          Cancel
        </button>
        <button style={{
          padding: "8px 16px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#ffffff",
          background: `linear-gradient(135deg, ${P}, #9D7FFF)`,
          border: "none",
          cursor: "pointer",
        }}>
          Generate Key
        </button>
      </div>
    </div>
  );
}

// ─── Card: Budget Limits ──────────────────────────────────────────────────────

function BudgetCard() {
  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }}>
      <div>
        <Eyebrow color={C}>Spend Control</Eyebrow>
        <CardTitle>Budget Limits</CardTitle>
        <CardDesc>
          Hard caps per workspace prevent billing surprises in production.
        </CardDesc>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <Eyebrow>Workspace Name</Eyebrow>
          <FieldBox>aura</FieldBox>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div>
            <Eyebrow>Budget (USD)</Eyebrow>
            <FieldBox>
              <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.78)" }}>88</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <ChevronUp size={9} style={{ color: "rgba(255,255,255,0.28)" }} />
                <ChevronDown size={9} style={{ color: "rgba(255,255,255,0.28)" }} />
              </div>
            </FieldBox>
          </div>
          <div>
            <Eyebrow>Period</Eyebrow>
            <FieldBox>
              <span>Weekly</span>
              <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.38)" }} />
            </FieldBox>
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 500, marginBottom: "12px", color: G }}>
            ✓ Workspace updated successfully
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 500,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.62)",
              cursor: "pointer",
            }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card: Smart Alerts ───────────────────────────────────────────────────────

function AlertCard() {
  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }}>
      <div>
        <Eyebrow color={A}>Monitoring</Eyebrow>
        <CardTitle>Smart Alerts</CardTitle>
        <CardDesc>
          Real-time notifications for rate limit breaches, errors, and budget thresholds.
        </CardDesc>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          flex: 1,
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "rgba(255,90,107,0.055)",
          border: "1px solid rgba(255,90,107,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{
            marginTop: "2px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "rgba(255,181,71,0.1)",
          }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: A, boxShadow: `0 0 7px ${A}` }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", lineHeight: 1.25 }}>
                Rate Limit Exceeded: openai
              </span>
              <span style={{ fontSize: "10px", flexShrink: 0, marginTop: "2px", color: "rgba(255,255,255,0.26)" }}>
                20m ago
              </span>
            </div>
            <p style={{ fontSize: "12px", lineHeight: 1.65, color: "rgba(255,255,255,0.48)" }}>
              The provider openai rejected the request due to rate limits or exhausted quota.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingTop: "4px" }}>
          <span style={{
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.36)",
          }}>
            Source: ChatService
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 500,
              background: "rgba(124,92,252,0.16)",
              border: "1px solid rgba(124,92,252,0.28)",
              color: PL,
              cursor: "pointer",
            }}>
              Acknowledge
            </button>
            <button style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 500,
              background: "rgba(35,209,139,0.13)",
              border: "1px solid rgba(35,209,139,0.26)",
              color: G,
              cursor: "pointer",
            }}>
              Resolve
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Card: Zero-Cost Cache Hit ────────────────────────────────────────────────

function CacheHitCard() {
  const topRow = [
    { k: "REQUEST ID",   v: "cmrjvgg32003…" },
    { k: "STATUS CODE",  v: "200" },
    { k: "PROVIDER",     v: "Groq" },
  ];
  const midRow = [
    { k: "MODEL",   v: "llama-3.1-8b" },
    { k: "LATENCY", v: "5ms" },
    { k: "COST",    v: "—" },
  ];
  const botRow = [
    { k: "SAVED TO CACHE", v: "No (Served from cache)" },
    { k: "TIME",           v: "Jul 14, 12:47:05 AM" },
  ];

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "16px", boxSizing: "border-box" }}>
      <div>
        <Eyebrow color={G}>Cost Efficiency</Eyebrow>
        <CardTitle>Zero-Cost Responses</CardTitle>
        <CardDesc>
          Cache hits return in milliseconds at $0.00. No model compute required.
        </CardDesc>
      </div>

      <div style={{
        flex: 1,
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* Request header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: G, boxShadow: `0 0 5px ${G}` }} />
              <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: "#ffffff" }}>
                llama-3.1-8b-instant
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.32)" }}>9 Groq · Aura Proxy</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <span style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              background: "rgba(35,209,139,0.16)",
              color: G,
              border: `1px solid rgba(35,209,139,0.28)`,
            }}>
              HIT
            </span>
            <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: G }}>5ms</span>
            <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.38)" }}>$0.00000</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>10m ago</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <DetailRow items={topRow} cols={3} />
          <DetailRow items={midRow} cols={3} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
            {botRow.map(({ k, v }, i) => (
              <div key={k} style={{
                padding: "12px 16px",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
              }}>
                <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", color: "rgba(255,255,255,0.26)" }}>{k}</p>
                <p style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.63)" }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FeaturesBento() {
  return (
    <section
      id="features"
      style={{
        position: "relative",
        width: "100%",
        background: "transparent",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Section Header */}
      <div style={{
        textAlign: "center",
        paddingTop: "80px",
        paddingBottom: "56px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}>
        <p className="section-overline" style={{ justifyContent: "center", marginBottom: "1rem" }}>
          Platform Features
        </p>

        <h2 style={{
          fontSize: "clamp(48px, 6vw, 66px)",
          fontWeight: 900,
          lineHeight: 1.06,
          color: "#ffffff",
          marginBottom: "12px",
        }}>
          Not just a proxy.
        </h2>
        <h2 style={{
          fontSize: "clamp(48px, 6vw, 66px)",
          fontWeight: 900,
          lineHeight: 1.06,
          marginBottom: "28px",
          background: `linear-gradient(130deg, ${P} 0%, ${PL} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          A full edge platform.
        </h2>
        <p style={{
          fontSize: "16px",
          lineHeight: 1.75,
          margin: "0 auto",
          color: "rgba(255,255,255,0.46)",
          maxWidth: "600px",
        }}>
          Everything you need to observe, route and control your LLM
          infrastructure in one place.
        </p>
      </div>

      {/* Bento Grid */}
      <div style={{
        paddingLeft: "clamp(16px, 5vw, 80px)",
        paddingRight: "clamp(16px, 5vw, 80px)",
        paddingBottom: "96px",
        maxWidth: "1536px",
        margin: "0 auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "relative",
            borderRadius: "32px",
            overflow: "hidden",
            background: "linear-gradient(180deg, rgba(255,255,255,0.022) 0%, rgba(255,255,255,0.012) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 0 80px rgba(124,92,252,0.05), inset 0 0 40px rgba(124,92,252,0.02)",
          }}
        >
          {/* Ambient container glow */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: "absolute",
              top: "20%",
              left: "20%",
              width: "60%",
              height: "60%",
              background: "radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 60%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          {/* Row 1 — 4 | 8 (33% | 67%) */}
          <div style={{ display: "grid", gridTemplateColumns: "4fr 8fr", borderBottom: DIV }}>
            <Card style={{ borderRight: DIV, minHeight: 380 }}>
              <FallbackCard />
            </Card>
            <Card style={{ minHeight: 380 }}>
              <CacheCard />
            </Card>
          </div>

          {/* Row 2 — 7 | 5 (58% | 42%) */}
          <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", borderBottom: DIV }}>
            <Card style={{ borderRight: DIV, minHeight: 340 }}>
              <LogsCard />
            </Card>
            <Card style={{ minHeight: 340 }}>
              <KeyCard />
            </Card>
          </div>

          {/* Row 3 — equal thirds */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <Card style={{ borderRight: DIV, minHeight: 350 }}>
              <BudgetCard />
            </Card>
            <Card style={{ borderRight: DIV, minHeight: 350 }}>
              <AlertCard />
            </Card>
            <Card style={{ minHeight: 350 }}>
              <CacheHitCard />
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
