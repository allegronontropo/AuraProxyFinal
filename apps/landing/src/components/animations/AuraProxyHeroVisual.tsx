"use client";

import React, { useEffect, useRef, useState } from "react";
import { Globe, Smartphone, Server, Shield, LineChart, Share2, Grid } from "lucide-react";

// ─── PROVIDER LOGOS ──────────────────────────────────────────────────────────

const OpenAILogo = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <path
      d="M75.2,52.1c0.4-1.2,0.6-2.5,0.6-3.8c0-5.8-4-10.9-9.5-12.2c0.4-1.5,0.4-3.1,0-4.6
       c-0.9-3.7-3.4-6.8-6.9-8.4c-1.2-0.5-2.5-0.9-3.8-1c-2.4-3.8-6.6-6.1-11.1-6.1
       c-1.3,0-2.6,0.2-3.8,0.6c-1.5-0.4-3.1-0.4-4.6,0C32.4,17.4,29.3,20,27.7,23.5
       c-0.5,1.2-0.9,2.5-1,3.8c-3.8,2.4-6.1,6.6-6.1,11.1c0,1.3,0.2,2.6,0.6,3.8
       c-0.4,1.5-0.4,3.1,0,4.6c0.9,3.7,3.4,6.8,6.9,8.4c1.2,0.5,2.5,0.9,3.8,1
       c2.4,3.8,6.6,6.1,11.1,6.1c1.3,0,2.6-0.2,3.8-0.6c1.5,0.4,3.1,0.4,4.6,0
       c3.7,0.9,6.8,3.4,8.4,6.9c0.5,1.2,0.9,2.5,1,3.8c3.8-2.4,6.1-6.6,6.1-11.1
       c0-1.3-0.2-2.6-0.6-3.8C75,55.3,75,53.7,75.2,52.1z"
      fill="#10a37f"
    />
  </svg>
);

const AnthropicLogo = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" fill="none">
    <path d="M24 82 L38 22 H54 L68 82 H53 L49 66 H33 L29 82 Z" fill="#cc785c" />
    <path d="M35.5 54 H46.5 L41 33 Z" fill="#ffffff" fillOpacity="0.9" />
    <path d="M74 82 L86 22 H98 L86 82 Z" fill="#cc785c" />
  </svg>
);

const GeminiLogo = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" fill="none">
    <defs>
      <linearGradient id="gem-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9bc5ff" />
        <stop offset="35%" stopColor="#e879f9" />
        <stop offset="70%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#ffb000" />
      </linearGradient>
    </defs>
    <path
      d="M50 15 C50 40 60 50 85 50 C60 50 50 60 50 85 C50 60 40 50 15 50 C40 50 50 40 50 15 Z"
      fill="url(#gem-g)"
    />
  </svg>
);

const MistralLogo = ({ size = 32 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" fill="none">
    <g transform="scale(0.75) translate(16,16)">
      <rect x="0"  y="0"  width="10" height="100" fill="#ff4e00" />
      <rect x="90" y="0"  width="10" height="100" fill="#ff4e00" />
      <rect x="10" y="0"  width="22" height="22"  fill="#FFCB00" />
      <rect x="78" y="0"  width="12" height="22"  fill="#FF8300" />
      <rect x="10" y="22" width="46" height="22"  fill="#FF8300" />
      <rect x="68" y="22" width="22" height="22"  fill="#FF4E00" />
      <rect x="10" y="44" width="90" height="22"  fill="#FF4E00" />
      <rect x="10" y="66" width="22" height="34"  fill="#E60000" />
      <rect x="44" y="66" width="24" height="22"  fill="#FF4E00" />
      <rect x="78" y="66" width="12" height="34"  fill="#E60000" />
    </g>
  </svg>
);

// ─── AURA PROXY ORBITAL LOGO ─────────────────────────────────────────────────
interface AuraLogoProps {
  isActive?: boolean;
  isMatched?: boolean;
  t?: number;
  size?: number;
}

const AuraProxyLogo: React.FC<AuraLogoProps> = ({
  isActive = false,
  isMatched = false,
  t = 0,
  size = 96,
}) => {
  const cx = 120, cy = 120, LOOP = 8000;
  const a1 = (t / LOOP) * Math.PI * 2 * 2.5;
  const a2 = -(t / LOOP) * Math.PI * 2 * 1.8 + Math.PI * 0.65;
  const a3 = (t / LOOP) * Math.PI * 2 * 3.3 + Math.PI * 1.2;
  const p1 = { x: +(cx + 100 * Math.cos(a1)).toFixed(4), y: +(cy + 100 * Math.sin(a1)).toFixed(4) };
  const p2 = { x: +(cx + 78  * Math.cos(a2)).toFixed(4), y: +(cy + 78  * Math.sin(a2)).toFixed(4) };
  const p3 = { x: +(cx + 100 * Math.cos(a3)).toFixed(4), y: +(cy + 100 * Math.sin(a3)).toFixed(4) };

  const hexPts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60) * (Math.PI / 180);
    return { x: cx + 58 * Math.cos(a), y: cy + 58 * Math.sin(a) };
  });
  const hexPath = hexPts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ") + " Z";

  const acc  = isMatched ? "#10b981" : "#a78bfa";
  const acc2 = isMatched ? "#34d399" : "#c084fc";
  const bg   = isMatched ? "rgba(4,38,22,0.72)" : "rgba(8,4,32,0.78)";
  const pOp  = isActive || isMatched ? 1 : 0.32;

  return (
    <svg viewBox="0 0 240 240" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="la-amb" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={acc} stopOpacity="0.22" />
          <stop offset="100%" stopColor={acc} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="la-mark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={isMatched ? "#6ee7b7" : "#e4d4ff"} />
          <stop offset="55%"  stopColor={isMatched ? "#10b981" : "#a78bfa"} />
          <stop offset="100%" stopColor={isMatched ? "#047857" : "#5b21b6"} />
        </linearGradient>
        <filter id="la-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="la-strong" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r="115" fill="url(#la-amb)" />
      <circle cx={cx} cy={cy} r="112" stroke={acc} strokeOpacity="0.09" strokeWidth="1" strokeDasharray="1.5 10" />

      {/* Rotating outer ring */}
      <g className="aura-spin-cw">
        <circle cx={cx} cy={cy} r="100" stroke={acc} strokeOpacity="0.24" strokeWidth="1.3" strokeDasharray="12 20" />
        <circle cx={cx + 100} cy={cy} r="4.5" fill={acc} opacity={pOp * 0.9} filter="url(#la-glow)" />
      </g>

      {/* Counter-rotating ring */}
      <g className="aura-spin-ccw">
        <circle cx={cx} cy={cy} r="78" stroke={acc2} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="7 16" />
        <circle cx={cx + 78} cy={cy} r="3.2" fill={acc2} opacity={pOp * 0.75} filter="url(#la-glow)" />
      </g>

      {/* JS-sync particles */}
      <circle cx={p1.x} cy={p1.y} r="3.2" fill={acc}  opacity={pOp * 0.85} filter="url(#la-glow)" />
      <circle cx={p2.x} cy={p2.y} r="2.4" fill={acc2} opacity={pOp * 0.65} />
      <circle cx={p3.x} cy={p3.y} r="2"   fill={acc}  opacity={pOp * 0.5}  />

      {/* Hexagon + spokes */}
      <path d={hexPath} stroke={acc} strokeOpacity="0.32" strokeWidth="1.6" />
      {hexPts.map((p, i) => (
        <React.Fragment key={i}>
          <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={acc} strokeOpacity="0.1" strokeWidth="0.8" />
          <circle cx={p.x} cy={p.y} r={2.8} fill={acc} fillOpacity={pOp > 0.5 ? 0.75 : 0.22} filter={pOp > 0.5 ? "url(#la-glow)" : undefined} />
        </React.Fragment>
      ))}

      {/* Core */}
      <circle cx={cx} cy={cy} r="44" fill={bg} stroke={acc} strokeOpacity={pOp > 0.5 ? 0.65 : 0.45} strokeWidth="1.8" filter={pOp > 0.5 ? "url(#la-glow)" : undefined} />

      {/* "A" mark */}
      <path d="M 120,82 L 147,158 H 132 L 120,118 L 108,158 H 93 Z" fill="url(#la-mark)" filter="url(#la-glow)" />
      <path d="M 106,138 Q 120,125 134,138" stroke="rgba(255,255,255,0.88)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M 120,82 L 147,158 H 132 L 120,118 L 108,158 H 93 Z" fill={isMatched ? "rgba(16,185,129,0.18)" : "rgba(124,92,252,0.18)"} filter="url(#la-strong)" />

      {/* Ripples */}
      {isMatched && (
        <>
          <circle cx={cx} cy={cy} r="44" fill="none" stroke="#10b981" strokeWidth="2"   className="aura-ripple-1" />
          <circle cx={cx} cy={cy} r="44" fill="none" stroke="#10b981" strokeWidth="1.5" className="aura-ripple-2" />
          <circle cx={cx} cy={cy} r="44" fill="none" stroke="#34d399" strokeWidth="1"   className="aura-ripple-3" />
        </>
      )}
      {isActive && !isMatched && (
        <>
          <circle cx={cx} cy={cy} r="44" fill="none" stroke="#a78bfa" strokeWidth="2" className="aura-ripple-1" />
          <circle cx={cx} cy={cy} r="44" fill="none" stroke="#c084fc" strokeWidth="1" className="aura-ripple-2" />
        </>
      )}
    </svg>
  );
};

// ─── FEATURE DEMO PANELS ─────────────────────────────────────────────────────
type FeatureId = "cache" | "routing" | "observability" | "guardrails";

interface DemoProps {
  t: number;
  isMiss: boolean;
  isHit: boolean;
}

const CacheDemo: React.FC<DemoProps> = ({ isMiss, isHit }) => (
  <div className="flex flex-col h-full justify-between">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">Semantic Waveform</span>
      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
        isHit ? "bg-emerald-500/15 text-emerald-400" : isMiss ? "bg-orange-500/15 text-orange-400" : "bg-white/5 text-white/25"
      }`}>
        {isHit ? "HIT · 5ms" : isMiss ? "MISS · 324ms" : "SCANNING"}
      </span>
    </div>
    <div className="flex-1 relative rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 260 44" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg-p" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(168,85,247,0)" />
            <stop offset="50%"  stopColor="rgba(168,85,247,0.55)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
          <linearGradient id="wg-e" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(16,185,129,0)" />
            <stop offset="50%"  stopColor="rgba(16,185,129,0.85)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </linearGradient>
          <linearGradient id="wg-o" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(249,115,22,0)" />
            <stop offset="50%"  stopColor="rgba(249,115,22,0.7)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </linearGradient>
        </defs>
        {/* Baseline */}
        <path d="M 0 22 Q 65 8 130 22 T 260 22" stroke="rgba(168,85,247,0.18)" strokeWidth="1.5" fill="none" />
        {isHit && (
          <>
            <path d="M 0 22 Q 65 8 130 22 T 260 22" stroke="url(#wg-e)" strokeWidth="2.5" fill="none" style={{ strokeDasharray: 140, animation: "aura-wave 2.5s linear infinite" }} />
            <path d="M 0 22 Q 65 8 130 22 T 260 22" stroke="rgba(16,185,129,0.15)" strokeWidth="7" fill="none" />
          </>
        )}
        {isMiss && (
          <path d="M 0 22 L 26 10 L 52 34 L 78 6 L 104 38 L 130 16 L 156 28 L 182 10 L 208 32 L 234 14 L 260 22"
            stroke="url(#wg-o)" strokeWidth="2" fill="none" style={{ strokeDasharray: 220, animation: "aura-wave 4s linear infinite" }} />
        )}
        {!isHit && !isMiss && (
          <path d="M 0 22 Q 65 14 130 22 T 260 22" stroke="url(#wg-p)" strokeWidth="1.5" fill="none" style={{ strokeDasharray: 110, animation: "aura-wave 5s linear infinite" }} />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-white/30 font-bold">
        {isHit ? "MATCH: 92.4%" : isMiss ? "SIMILARITY: 74%" : "AWAITING REQUEST"}
      </span>
    </div>
  </div>
);

const RoutingDemo: React.FC<{ t: number }> = ({ t }) => {
  const phase = (t % 5000) / 5000;
  const switching = phase > 0.35 && phase < 0.55;
  const failover  = phase >= 0.55;
  const providers = [
    { name: "OpenAI",    active: !failover, failing: switching || failover },
    { name: "Claude",    active: failover,  failing: false },
    { name: "Gemini",    active: false,     failing: false },
  ];
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">Route Table</span>
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full transition-all duration-500 ${switching ? "bg-amber-500/15 text-amber-400 animate-pulse" : failover ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/25"}`}>
          {switching ? "REROUTING" : failover ? "FAILOVER ACTIVE" : "STABLE"}
        </span>
      </div>
      <div className="flex gap-2 flex-1">
        {providers.map(({ name, active, failing }) => (
          <div key={name} className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-all duration-500 ${
            failing && !active ? "border-red-500/30 bg-red-500/5 opacity-40"
            : active          ? "border-emerald-500/40 bg-emerald-500/8 shadow-[0_0_16px_rgba(16,185,129,0.12)]"
            : "border-white/5 bg-white/[0.02] opacity-40"
          }`}>
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              failing && !active ? "bg-red-500" : active ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-white/20"
            }`} />
            <span className="text-[9px] font-mono text-white/50 font-bold">{name}</span>
            <span className={`text-[7.5px] font-mono ${failing && !active ? "text-red-400" : active ? "text-emerald-400" : "text-white/20"}`}>
              {failing && !active ? "FAIL" : active ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ObservabilityDemo: React.FC<{ t: number }> = ({ t }) => {
  const bars = [5, 3, 8, 4, 9, 6, 5, 7, 4, 8, 6, 9].map((base, i) =>
    Math.max(12, Math.min(92, base * 8 + 28 * Math.abs(Math.sin(t / 380 + i * 0.65))))
  );
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">Request Throughput</span>
        <span className="text-[9px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
          LIVE
        </span>
      </div>
      <div className="flex items-end gap-1 flex-1 pb-0.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-100"
            style={{ height: `${h}%`, background: `rgba(139,92,246,${0.25 + 0.45 * (h / 100)})` }}
          />
        ))}
      </div>
    </div>
  );
};

const GuardrailsDemo: React.FC<{ t: number }> = ({ t }) => {
  const cycle = (t % 3200) / 3200;
  const incoming = cycle < 0.4;
  const blocked  = cycle >= 0.4 && cycle < 0.75;
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">Policy Engine</span>
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${blocked ? "bg-red-500/15 text-red-400 animate-pulse" : incoming ? "bg-amber-500/15 text-amber-400" : "bg-white/5 text-white/25"}`}>
          {blocked ? "BLOCKED" : incoming ? "INSPECTING" : "LISTENING"}
        </span>
      </div>
      <div className="flex-1 rounded-xl border flex items-center justify-center transition-all duration-500"
        style={{ borderColor: blocked ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.05)", background: blocked ? "rgba(239,68,68,0.05)" : "rgba(0,0,0,0.2)" }}>
        {blocked ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full border-2 border-red-500/60 flex items-center justify-center">
              <span className="text-red-400 text-base font-bold leading-none">✕</span>
            </div>
            <span className="text-[8.5px] font-mono text-red-400 font-bold">Policy violation</span>
          </div>
        ) : incoming ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[8.5px] font-mono text-amber-400">Scanning request…</span>
          </div>
        ) : (
          <span className="text-[8.5px] font-mono text-white/20">No threats detected</span>
        )}
      </div>
    </div>
  );
};

// ─── SHARED GLASS STYLE ───────────────────────────────────────────────────────
const GLASS = {
  background:    "rgba(255,255,255,0.03)",
  backdropFilter:"blur(16px)",
  border:        "1px solid rgba(255,255,255,0.08)",
  borderRadius:  "24px",
  boxShadow:     "0 0 0 1px rgba(124,92,252,0.06), 0 8px 40px rgba(0,0,0,0.45)",
} as React.CSSProperties;

const GLASS_ACTIVE = {
  ...GLASS,
  boxShadow: "0 0 0 1px rgba(124,92,252,0.22), 0 0 40px rgba(124,92,252,0.10), 0 8px 40px rgba(0,0,0,0.5)",
} as React.CSSProperties;

const GLASS_HERO = {
  background:    "rgba(255,255,255,0.04)",
  backdropFilter:"blur(24px)",
  border:        "1px solid rgba(255,255,255,0.10)",
  borderRadius:  "28px",
  boxShadow:     "0 0 0 1px rgba(124,92,252,0.18), 0 0 60px rgba(124,92,252,0.09), 0 16px 56px rgba(0,0,0,0.55)",
} as React.CSSProperties;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const FEATURES: { id: FeatureId; label: string; Icon: React.ElementType }[] = [
  { id: "cache",         label: "Semantic Cache", Icon: Grid      },
  { id: "routing",       label: "Smart Routing",  Icon: Share2    },
  { id: "observability", label: "Observability",  Icon: LineChart  },
  { id: "guardrails",    label: "Guardrails",     Icon: Shield    },
];

export default function AuraProxyHeroVisual() {
  const [time, setTime]           = useState<number>(0);
  const [scale, setScale]         = useState<number>(1);
  const [active, setActive]       = useState<FeatureId>("cache");
  const containerRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const parentWidth  = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      const marginOffset = window.innerWidth < 645 ? 16 : 48;
      const available    = parentWidth - marginOffset;
      setScale(Math.min(1.0, available / 1100));
    };
    window.addEventListener("resize", updateScale);
    updateScale();
    const timer = setTimeout(updateScale, 150);
    return () => { window.removeEventListener("resize", updateScale); clearTimeout(timer); };
  }, []);

  const LOOP_DURATION = 8000;
  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;
    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime    = now;
      setTime(prev => (prev + delta) % LOOP_DURATION);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const t        = time;
  const isPhase1 = t < 4000;
  const isPhase2 = t >= 4000;

  // ─── Phase flags ──────────────────────────────────────────────────────────
  const p1In      = t >= 0    && t < 1000;
  const p1Proc    = t >= 900  && t < 1500;
  const p1Fwd     = t >= 1200 && t < 2100;
  const p1OAI     = t >= 1900 && t < 2800;
  const p1Resp    = t >= 2100 && t < 2900;
  const p1Back    = t >= 2900 && t < 3600;

  const p2In      = t >= 4000 && t < 5000;
  const p2Match   = t >= 4900 && t < 5600;
  const p2Back    = t >= 5100 && t < 5800;

  const isMiss    = t >= 1000 && t < 2900;
  const isHit     = t >= 5000 && t < 7700;

  const proxyActive = p1Proc || p2Match;

  // ─── Bezier helpers ───────────────────────────────────────────────────────
  const bez = (
    tv: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ) => {
    const u = 1 - tv, tt = tv * tv, uu = u * u, uuu = uu * u, ttt = tt * tv;
    return { x: uuu*p0.x + 3*uu*tv*p1.x + 3*u*tt*p2.x + ttt*p3.x,
             y: uuu*p0.y + 3*uu*tv*p1.y + 3*u*tt*p2.y + ttt*p3.y };
  };
  const ease = (x: number) => x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2;

  // ─── Packet bubble ────────────────────────────────────────────────────────
  // Left card top-section center connects at (280, 140) → proxy center (410, 240)
  const L = { x: 280, y: 140 };
  const C = { x: 410, y: 240 };
  const LC_cp1 = { x: 330, y: 140 };
  const LC_cp2 = { x: 360, y: 240 };

  const getPacket = () => {
    if (t >= 0 && t < 1000) {
      const pt = bez(ease(t / 1000), L, LC_cp1, LC_cp2, C);
      return { ...pt, label: "POST /v1/chat/completions", meta: "Incoming Request", badge: "REQ",
               color: "border-purple-500/70 text-purple-300 bg-slate-950/95 shadow-[0_0_18px_rgba(168,85,247,0.35)]" };
    }
    if (t >= 1200 && t < 2000) {
      const tf = (t - 1200) / 800;
      const pt = bez(ease(tf), C, { x:740,y:240 }, { x:770,y:90 }, { x:820,y:90 });
      return { ...pt, label: "openai.com/chat/completions", meta: "Cache Miss · Forwarding", badge: "MISS",
               color: "border-orange-500/70 text-orange-400 bg-slate-950/95 shadow-[0_0_18px_rgba(249,115,22,0.35)]" };
    }
    if (t >= 2100 && t < 2850) {
      const tf = (t - 2100) / 750;
      const pt = bez(ease(tf), { x:820,y:90 }, { x:770,y:90 }, { x:740,y:240 }, C);
      return { ...pt, label: "HTTP 200 OK · 324ms", meta: "Provider Response", badge: "RESP",
               color: "border-emerald-500/70 text-emerald-400 bg-slate-950/95 shadow-[0_0_18px_rgba(16,185,129,0.35)]" };
    }
    if (t >= 2900 && t < 3600) {
      const tf = (t - 2900) / 700;
      const pt = bez(ease(tf), C, LC_cp2, LC_cp1, L);
      return { ...pt, label: "Delivered & Cached ⚡", meta: "L7 Return Path", badge: "DONE",
               color: "border-emerald-400 text-emerald-300 bg-[#011d12]/95 shadow-[0_0_24px_rgba(16,185,129,0.5)] font-bold" };
    }
    if (t >= 4000 && t < 5000) {
      const pt = bez(ease((t - 4000) / 1000), L, LC_cp1, LC_cp2, C);
      return { ...pt, label: "POST /v1/chat/completions", meta: "Semantic Lookup", badge: "LOOKUP",
               color: "border-violet-500/80 text-violet-300 bg-slate-950/95 shadow-[0_0_18px_rgba(139,92,246,0.35)]" };
    }
    if (t >= 5100 && t < 5800) {
      const tf = (t - 5100) / 700;
      const pt = bez(ease(tf), C, LC_cp2, LC_cp1, L);
      return { ...pt, label: "⚡ Cache Hit · 5ms (92% match)", meta: "Instant Return", badge: "HIT",
               color: "border-emerald-400 text-emerald-300 bg-[#001f13]/95 shadow-[0_0_28px_rgba(52,211,153,0.6)] font-extrabold" };
    }
    return null;
  };
  const packet = getPacket();

  return (
    <div className="w-full select-none flex flex-col items-center justify-center">
      {/* ── Keyframes ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes auraSpin    { to { transform: rotate(360deg);  } }
        @keyframes auraSpinCCW { to { transform: rotate(-360deg); } }
        @keyframes auraRipple  { 0% { opacity:.55; transform:scale(1); } 100% { opacity:0; transform:scale(2.6); } }
        @keyframes aura-dash   { 0% { stroke-dashoffset:320; }  100% { stroke-dashoffset:0;    } }
        @keyframes aura-dash-b { 0% { stroke-dashoffset:0;   }  100% { stroke-dashoffset:-320; } }
        @keyframes aura-dash-f { 0% { stroke-dashoffset:220; }  100% { stroke-dashoffset:0;    } }
        @keyframes aura-wave   { 0% { stroke-dashoffset:0; }    100% { stroke-dashoffset:-300; } }
        @keyframes aura-ping   { 0%,100% { opacity:1; } 50% { opacity:0; } }

        .aura-spin-cw  { transform-box:fill-box; transform-origin:center; animation:auraSpin    25s linear infinite; }
        .aura-spin-ccw { transform-box:fill-box; transform-origin:center; animation:auraSpinCCW 18s linear infinite; }
        .aura-ripple-1 { transform-box:fill-box; transform-origin:center; animation:auraRipple 2s ease-out          infinite; }
        .aura-ripple-2 { transform-box:fill-box; transform-origin:center; animation:auraRipple 2s ease-out  0.67s   infinite; }
        .aura-ripple-3 { transform-box:fill-box; transform-origin:center; animation:auraRipple 2s ease-out  1.34s   infinite; }
      `}} />

      <div
        ref={containerRef}
        className="relative overflow-visible flex items-center justify-center w-full"
        style={{ height: `${540 * scale}px`, transition: "height 0.15s ease-out" }}
      >
        <div
          className="absolute"
          style={{ width:"1100px", height:"540px", transform:`scale(${scale})`, transformOrigin:"center center" }}
        >
          <div className="relative w-[1100px] h-[540px] mx-auto">

            {/* ══ WIRE SVG LAYER ══════════════════════════════════════════════ */}
            <svg className="absolute inset-0 z-0 w-full h-full" viewBox="0 0 1100 540" fill="none">
              <defs>
                <filter id="gp" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5"  result="b1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b2" />
                  <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="ge" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6"  result="b1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b2" />
                  <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <linearGradient id="grad-p"  x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#a78bfa"/>
                  <stop offset="100%" stopColor="#ffffff"/>
                </linearGradient>
                <linearGradient id="grad-e"  x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#ffffff"/>
                </linearGradient>
                <linearGradient id="grad-pe" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"  stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#10b981"/>
                </linearGradient>
                <linearGradient id="grad-ep" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%"  stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>

              {/* ── Static base wires (always visible, very dim) ── */}
              {/* Left card → center */}
              <path d="M 280,140 C 330,140 360,240 410,240" stroke="rgba(124,92,252,0.18)" strokeWidth="2"  />
              <path d="M 280,240 L 410,240"                  stroke="rgba(124,92,252,0.12)" strokeWidth="1.5"/>
              <path d="M 280,340 C 330,340 360,240 410,240" stroke="rgba(124,92,252,0.12)" strokeWidth="1.5"/>
              {/* Center → providers */}
              <path d="M 690,240 C 740,240 770,90  820,90"  stroke="rgba(16,185,129,0.18)" strokeWidth="2"  />
              <path d="M 690,240 C 740,240 770,190 820,190" stroke="rgba(16,185,129,0.12)" strokeWidth="1.5"/>
              <path d="M 690,240 C 740,240 770,290 820,290" stroke="rgba(14,165,233,0.12)"  strokeWidth="1.5"/>
              <path d="M 690,240 C 740,240 770,390 820,390" stroke="rgba(124,92,252,0.10)"  strokeWidth="1.5"/>

              {/* ── Phase 1: incoming ── */}
              {isPhase1 && p1In && (<>
                <path d="M 280,140 C 330,140 360,240 410,240" stroke="url(#grad-p)" strokeWidth="3" filter="url(#gp)" />
                <path d="M 280,140 C 330,140 360,240 410,240" stroke="rgba(196,132,252,0.9)" strokeWidth="3.5" strokeDasharray="16 500" style={{animation:"aura-dash 0.72s linear infinite"}} filter="url(#gp)" />
                <path d="M 280,140 C 330,140 360,240 410,240" stroke="rgba(167,139,250,0.5)" strokeWidth="2"   strokeDasharray="9  500" style={{animation:"aura-dash 0.72s linear 0.28s infinite"}} />
              </>)}

              {/* ── Phase 1: forward to OpenAI ── */}
              {isPhase1 && p1Fwd && (<>
                <path d="M 690,240 C 740,240 770,90 820,90" stroke="url(#grad-pe)" strokeWidth="3" filter="url(#gp)" />
                <path d="M 690,240 C 740,240 770,90 820,90" stroke="rgba(167,139,250,0.85)" strokeWidth="3.5" strokeDasharray="16 500" style={{animation:"aura-dash 0.85s linear infinite"}} filter="url(#gp)" />
                <path d="M 690,240 C 740,240 770,90 820,90" stroke="rgba(139,92,246,0.4)"   strokeWidth="2"   strokeDasharray="9  500" style={{animation:"aura-dash 0.85s linear 0.32s infinite"}} />
              </>)}

              {/* ── Phase 1: response from OpenAI ── */}
              {isPhase1 && p1Resp && (<>
                <path d="M 820,90 C 770,90 740,240 690,240" stroke="url(#grad-ep)" strokeWidth="3" filter="url(#ge)" />
                <path d="M 820,90 C 770,90 740,240 690,240" stroke="rgba(52,211,153,0.85)" strokeWidth="3.5" strokeDasharray="16 500" style={{animation:"aura-dash-b 0.85s linear infinite"}} filter="url(#ge)" />
                <path d="M 820,90 C 770,90 740,240 690,240" stroke="rgba(16,185,129,0.4)"  strokeWidth="2"   strokeDasharray="9  500" style={{animation:"aura-dash-b 0.85s linear 0.33s infinite"}} />
              </>)}

              {/* ── Phase 1: return to client ── */}
              {isPhase1 && p1Back && (<>
                <path d="M 410,240 C 360,240 330,140 280,140" stroke="url(#grad-e)" strokeWidth="4" filter="url(#ge)" />
                <path d="M 410,240 C 360,240 330,140 280,140" stroke="rgba(52,211,153,0.9)"  strokeWidth="4.5" strokeDasharray="18 500" style={{animation:"aura-dash-b 0.65s linear infinite"}} filter="url(#ge)" />
                <path d="M 410,240 C 360,240 330,140 280,140" stroke="rgba(16,185,129,0.5)"  strokeWidth="2.5" strokeDasharray="10 500" style={{animation:"aura-dash-b 0.65s linear 0.22s infinite"}} />
              </>)}

              {/* ── Phase 2: cache lookup ── */}
              {isPhase2 && p2In && (<>
                <path d="M 280,140 C 330,140 360,240 410,240" stroke="url(#grad-p)" strokeWidth="3.5" filter="url(#gp)" />
                <path d="M 280,140 C 330,140 360,240 410,240" stroke="rgba(196,132,252,0.9)" strokeWidth="4" strokeDasharray="16 500" style={{animation:"aura-dash 0.72s linear infinite"}} filter="url(#gp)" />
                <path d="M 280,140 C 330,140 360,240 410,240" stroke="rgba(139,92,246,0.5)"  strokeWidth="2" strokeDasharray="9  500" style={{animation:"aura-dash 0.72s linear 0.28s infinite"}} />
              </>)}

              {/* ── Phase 2: instant cache return ── */}
              {isPhase2 && p2Back && (<>
                <path d="M 410,240 C 360,240 330,140 280,140" stroke="url(#grad-e)" strokeWidth="5" filter="url(#ge)" />
                <path d="M 410,240 C 360,240 330,140 280,140" stroke="rgba(52,211,153,0.95)" strokeWidth="5.5" strokeDasharray="22 500" style={{animation:"aura-dash-f 0.48s linear infinite"}} filter="url(#ge)" />
                <path d="M 410,240 C 360,240 330,140 280,140" stroke="rgba(16,185,129,0.6)"  strokeWidth="3"   strokeDasharray="13 500" style={{animation:"aura-dash-f 0.48s linear 0.16s infinite"}} />
                <path d="M 410,240 C 360,240 330,140 280,140" stroke="rgba(110,231,183,0.35)" strokeWidth="2"   strokeDasharray="7  500" style={{animation:"aura-dash-f 0.48s linear 0.32s infinite"}} />
              </>)}
            </svg>

            {/* ══ FLOATING PACKET BUBBLE ══════════════════════════════════════ */}
            {packet && (
              <div
                className={`absolute pointer-events-none z-50 rounded-xl border px-3 py-1.5 font-mono text-[9.5px] whitespace-nowrap -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 backdrop-blur-sm ${packet.color}`}
                style={{ left:`${packet.x}px`, top:`${packet.y}px`, willChange:"transform,left,top", transition:"left 0.08s linear,top 0.08s linear" }}
              >
                <div className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[7px] font-bold uppercase tracking-widest text-slate-500">{packet.meta}</span>
                    <span className="text-[6.5px] font-extrabold px-1 py-px rounded bg-slate-900 border border-slate-800 text-slate-400">{packet.badge}</span>
                  </div>
                  <span className="text-slate-100 font-semibold tracking-tight max-w-[160px] truncate">{packet.label}</span>
                </div>
              </div>
            )}

            {/* ══ LEFT: SINGLE APPLICATION CARD ════════════════════════════════ */}
            {/* Positioned top=90, height=300px, right edge at x=280 */}
            <div
              className="absolute transition-all duration-500"
              style={{
                top: "90px", left: "5px", width: "275px",
                ...(p1In || p2In ? GLASS_ACTIVE : GLASS),
              }}
            >
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-[9px] font-mono tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Your Application
                </span>
              </div>

              {/* 3 source rows */}
              {[
                { Icon: Globe,       label: "Web App"    },
                { Icon: Smartphone,  label: "Mobile App" },
                { Icon: Server,      label: "Backend"    },
              ].map(({ Icon, label }, i) => {
                const isTopRow = i === 0;
                const rowActive = isTopRow && (p1In || p2In || p1Back || p2Back);
                return (
                  <div
                    key={label}
                    className="flex items-center justify-center gap-3.5 transition-all duration-400"
                    style={{
                      height: "100px",
                      borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      paddingLeft: "20px", paddingRight: "20px",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background: rowActive ? "rgba(124,92,252,0.15)" : "rgba(255,255,255,0.04)",
                        border:     rowActive ? "1px solid rgba(124,92,252,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <Icon
                        className="w-5 h-5 transition-colors duration-300"
                        style={{ color: rowActive ? "#a78bfa" : "rgba(255,255,255,0.45)" }}
                      />
                    </div>
                    <span
                      className="text-[15px] font-semibold tracking-tight transition-colors duration-300"
                      style={{ color: rowActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)" }}
                    >
                      {label}
                    </span>
                    {/* Connector dot (right edge) */}
                    {isTopRow && (
                      <div className="absolute" style={{ right: "-6px", top: "140px" }}>
                        <div
                          className="w-3 h-3 rounded-full border-2 transition-all duration-500"
                          style={{
                            background:   (p1In || p2In || p1Back || p2Back) ? "#a78bfa" : "rgba(30,27,75,0.9)",
                            borderColor:  (p1In || p2In || p1Back || p2Back) ? "#7c3aed" : "rgba(255,255,255,0.1)",
                            boxShadow:    (p1In || p2In || p1Back || p2Back) ? "0 0 12px rgba(167,139,250,0.7)" : "none",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ══ CENTER: AURA PROXY HERO CARD ═════════════════════════════════ */}
            <div
              className="absolute transition-all duration-500"
              style={{
                top: "90px", left: "410px", width: "280px",
                ...GLASS_HERO,
                ...(proxyActive ? {
                  boxShadow: "0 0 0 1px rgba(16,185,129,0.35), 0 0 70px rgba(16,185,129,0.12), 0 16px 56px rgba(0,0,0,0.55)"
                } : {}),
              }}
            >
              {/* Moving grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.4) 1px,transparent 1px)", backgroundSize: "20px 20px", borderRadius: "28px", animation: "none" }}
              />

              <div className="relative z-10 flex flex-col items-center px-5 pt-5 pb-5 gap-3">
                {/* Logo */}
                <div className={proxyActive ? "animate-pulse" : ""} style={{ animationDuration: "3s" }}>
                  <AuraProxyLogo isActive={p1Proc} isMatched={p2Match} t={t} size={100} />
                </div>

                {/* Title */}
                <div className="text-center -mt-1">
                  <h3 className="text-[14px] font-bold tracking-[0.25em] text-white">AURA PROXY</h3>
                  <p className="text-[8px] font-mono uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    AI Gateway · L7 Engine
                  </p>
                </div>

                {/* Feature tabs — 2×2 grid */}
                <div className="grid grid-cols-2 gap-1.5 w-full mt-1">
                  {FEATURES.map(({ id, label, Icon }) => {
                    const isActive = active === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActive(id)}
                        className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-semibold tracking-tight transition-all duration-200"
                        style={{
                          background:  isActive ? "rgba(124,92,252,0.18)" : "rgba(255,255,255,0.04)",
                          border:      isActive ? "1px solid rgba(124,92,252,0.45)" : "1px solid rgba(255,255,255,0.07)",
                          color:       isActive ? "#c4b5fd" : "rgba(255,255,255,0.4)",
                          boxShadow:   isActive ? "0 0 16px rgba(124,92,252,0.15)" : "none",
                        }}
                      >
                        <Icon size={11} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ══ DEMO PANEL — below center card ════════════════════════════════ */}
            <div
              className="absolute transition-all duration-400"
              style={{
                top: "430px", left: "410px", width: "280px", height: "98px",
                ...GLASS,
              }}
            >
              <div className="p-3.5 h-full">
                {active === "cache"         && <CacheDemo         t={t} isMiss={isMiss} isHit={isHit} />}
                {active === "routing"       && <RoutingDemo       t={t} />}
                {active === "observability" && <ObservabilityDemo t={t} />}
                {active === "guardrails"    && <GuardrailsDemo    t={t} />}
              </div>
            </div>

            {/* ══ RIGHT: PROVIDER TILES ════════════════════════════════════════ */}
            {[
              { Logo: OpenAILogo,    name: "OpenAI",    yPos: 90,  wireActive: isPhase1 && p1OAI },
              { Logo: AnthropicLogo, name: "Anthropic", yPos: 190, wireActive: false },
              { Logo: GeminiLogo,    name: "Gemini",    yPos: 290, wireActive: false },
              { Logo: MistralLogo,   name: "Mistral",   yPos: 390, wireActive: false },
            ].map(({ Logo, name, yPos, wireActive }) => (
              <div
                key={name}
                className="absolute transition-all duration-500"
                style={{
                  top: `${yPos}px`, left: "820px", width: "275px", height: "80px",
                  ...(wireActive ? GLASS_ACTIVE : GLASS),
                  ...(wireActive ? {
                    boxShadow: "0 0 0 1px rgba(16,185,129,0.28), 0 0 28px rgba(16,185,129,0.12), 0 8px 40px rgba(0,0,0,0.45)",
                    transform: "scale(1.025)",
                  } : {}),
                  borderRadius: "20px",
                }}
              >
                {/* Left connector dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-500"
                  style={{ left: 0 }}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 transition-all duration-500"
                    style={{
                      background:  wireActive ? "#34d399" : "rgba(15,23,42,0.9)",
                      borderColor: wireActive ? "#10b981" : "rgba(255,255,255,0.1)",
                      boxShadow:   wireActive ? "0 0 12px rgba(52,211,153,0.8)" : "none",
                    }}
                  />
                </div>

                <div className="h-full flex items-center gap-4 px-5">
                  {/* Logo */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      background: wireActive ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
                      border:     wireActive ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Logo size={22} />
                  </div>

                  {/* Name only */}
                  <span
                    className="text-[15px] font-semibold tracking-tight transition-colors duration-300"
                    style={{ color: wireActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)" }}
                  >
                    {name}
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
