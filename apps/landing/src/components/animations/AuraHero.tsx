"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "framer-motion";
import { Globe, Smartphone, Server, Zap, Navigation, Activity, Shield } from "lucide-react";

const C = {
  bg: "#06060A",
  card: "#0D0D14",
  purple: "#7C4DFF",
  glow: "#9D6CFF",
  green: "#30E87A",
  blue: "#4CC3FF",
  yellow: "#FFC84D",
  red: "#FF6870",
  white: "#FFFFFF",
  muted: "#B5B5C7",
};

const PROVIDER_COLORS = [C.green, C.red, C.blue, C.yellow, C.muted];

const APP_ITEMS = [
  { Icon: Globe, label: "Web App" },
  { Icon: Smartphone, label: "Mobile App" },
  { Icon: Server, label: "Backend Service" },
];

const PROVIDERS = [
  { name: "OpenAI", abbr: "OA" },
  { name: "Anthropic", abbr: "An" },
  { name: "Google Gemini", abbr: "GG" },
  { name: "Mistral AI", abbr: "M" },
  { name: "+ Any LLM", abbr: "~" },
];

const FEATURES = [
  { Icon: Zap, label: "Semantic Cache" },
  { Icon: Navigation, label: "Smart Routing" },
  { Icon: Activity, label: "Observability" },
  { Icon: Shield, label: "Guardrails" },
];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

const cubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number) =>
  Math.pow(1 - t, 3) * p0 +
  3 * Math.pow(1 - t, 2) * t * p1 +
  3 * (1 - t) * t * t * p2 +
  Math.pow(t, 3) * p3;

interface CP { x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number }

const makeCPs = (x0: number, y0: number, x3: number, y3: number): CP => {
  const mx = (x0 + x3) / 2;
  return { x0, y0, x1: mx, y1: y0, x2: mx, y2: y3, x3, y3 };
};

const cpToPath = (c: CP) =>
  `M ${c.x0} ${c.y0} C ${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x3} ${c.y3}`;

type AnimPhase =
  | "idle"
  | "reqToCenter"
  | "atCenter"
  | "reqToProvider"
  | "atProvider"
  | "retFromProvider"
  | "retToApp"
  | "done";

interface Positions {
  w: number;
  h: number;
  leftRows: Array<{ rx: number; cy: number }>;
  rightRows: Array<{ lx: number; cy: number }>;
  centerL: { x: number; y: number };
  centerR: { x: number; y: number };
}

interface LoopParticleProps {
  cp: CP;
  duration: number;
  phase0: number;
  color: string;
  size: number;
}

function LoopParticle({ cp, duration, phase0, color, size }: LoopParticleProps) {
  const t = useMotionValue(phase0);
  const cx = useTransform(t, v => cubicBezier(v, cp.x0, cp.x1, cp.x2, cp.x3));
  const cy = useTransform(t, v => cubicBezier(v, cp.y0, cp.y1, cp.y2, cp.y3));
  const op = useTransform(t, [0, 0.08, 0.88, 1], [0, 0.95, 0.95, 0]);
  const r = useTransform(t, [0, 0.5, 1], [size * 0.5, size, size * 0.7]);
  const ctrlRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    let stopped = false;

    const loop = () => {
      if (stopped) return;
      t.set(0);
      ctrlRef.current = animate(t, 1, { duration, ease: "linear", onComplete: loop });
    };

    const firstDur = (1 - phase0) * duration;
    if (firstDur > 0.05) {
      ctrlRef.current = animate(t, 1, { duration: firstDur, ease: "linear", onComplete: loop });
    } else {
      loop();
    }

    return () => {
      stopped = true;
      ctrlRef.current?.stop();
    };
  }, [t, duration, phase0]);

  return (
    <circle
      cx={cx as unknown as number} cy={cy as unknown as number} r={r as unknown as number}
      fill={color} opacity={op as unknown as number}
      style={{ filter: `drop-shadow(0 0 ${size * 2}px ${color})` }}
    />
  );
}

interface ReqParticleProps {
  cp: CP;
  reverse?: boolean;
  color: string;
  size?: number;
  runKey: number;
  onDone?: () => void;
}

function ReqParticle({ cp, reverse = false, color, size = 5, runKey, onDone }: ReqParticleProps) {
  const t = useMotionValue(reverse ? 1 : 0);
  const cx = useTransform(t, v => cubicBezier(v, cp.x0, cp.x1, cp.x2, cp.x3));
  const cy = useTransform(t, v => cubicBezier(v, cp.y0, cp.y1, cp.y2, cp.y3));
  const op = useTransform(t, [0, 0.06, 0.94, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const target = reverse ? 0 : 1;
    t.set(reverse ? 1 : 0);
    const ctrl = animate(t, target, {
      duration: 1.5,
      ease: [0.4, 0, 0.2, 1],
      onComplete: onDone,
    });
    return () => ctrl.stop();
  }, [t, runKey, onDone, reverse]);

  return (
    <circle
      cx={cx as unknown as number} cy={cy as unknown as number} r={size}
      fill={color} opacity={op as unknown as number}
      style={{ filter: `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 4px ${color})` }}
    />
  );
}

const RIBBON_PHASESETS: Array<Array<{ duration: number; phase0: number; size: number }>> = [
  [{ duration: 2.2, phase0: 0.00, size: 1.9 },
   { duration: 2.8, phase0: 0.35, size: 2.3 },
   { duration: 2.0, phase0: 0.65, size: 1.5 },
   { duration: 3.2, phase0: 0.82, size: 1.1 }],
  [{ duration: 2.5, phase0: 0.15, size: 2.0 },
   { duration: 2.1, phase0: 0.50, size: 1.7 },
   { duration: 3.0, phase0: 0.73, size: 1.3 },
   { duration: 2.7, phase0: 0.90, size: 2.1 }],
  [{ duration: 2.3, phase0: 0.20, size: 1.8 },
   { duration: 2.9, phase0: 0.55, size: 2.2 },
   { duration: 2.0, phase0: 0.78, size: 1.4 },
   { duration: 3.1, phase0: 0.40, size: 1.0 }],
  [{ duration: 2.6, phase0: 0.10, size: 2.1 },
   { duration: 2.2, phase0: 0.45, size: 1.6 },
   { duration: 3.0, phase0: 0.68, size: 1.2 },
   { duration: 2.4, phase0: 0.85, size: 2.0 }],
  [{ duration: 2.4, phase0: 0.25, size: 1.7 },
   { duration: 2.8, phase0: 0.58, size: 2.4 },
   { duration: 2.1, phase0: 0.80, size: 1.3 },
   { duration: 3.3, phase0: 0.42, size: 1.0 }],
];

interface RibbonProps {
  cp: CP;
  color: string;
  glowing?: boolean;
  particleConfigs: Array<{ duration: number; phase0: number; size: number }>;
}

function Ribbon({ cp, color, glowing = false, particleConfigs }: RibbonProps) {
  const pathD = cpToPath(cp);
  return (
    <g>
      <path d={pathD} stroke={color} strokeWidth={7} fill="none"
        opacity={glowing ? 0.18 : 0.04}
        style={{ filter: "blur(5px)", transition: "opacity 0.5s" }} />
      <path d={pathD} stroke={color} strokeWidth={1.5} fill="none"
        opacity={glowing ? 0.75 : 0.38}
        style={{ transition: "opacity 0.5s" }} />
      <path d={pathD} stroke={color} strokeWidth={0.6} fill="none"
        opacity={glowing ? 0.9 : 0.2}
        style={{ filter: "blur(0.5px)", transition: "opacity 0.5s" }} />
      {particleConfigs.map((cfg, i) => (
        <LoopParticle key={i} cp={cp} color={color} {...cfg} />
      ))}
    </g>
  );
}

interface RibbonSVGProps {
  pos: Positions;
  phase: AnimPhase;
  appIdx: number;
  provIdx: number;
  runKey: number;
}

function RibbonSVG({ pos, phase, appIdx, provIdx, runKey }: RibbonSVGProps) {
  const { w, h, leftRows, rightRows, centerL, centerR } = pos;

  const leftCPs = leftRows.map(r => makeCPs(r.rx, r.cy, centerL.x, centerL.y));
  const rightCPs = rightRows.map(r => makeCPs(centerR.x, centerR.y, r.lx, r.cy));

  const isToCenter = phase === "reqToCenter";
  const isRetToApp = phase === "retToApp";
  const isToProvider = phase === "reqToProvider";
  const isRetFromProv = phase === "retFromProvider";

  const showLeftReq = isToCenter || isRetToApp;
  const showRightReq = isToProvider || isRetFromProv;

  return (
    <svg
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", overflow: "visible",
      }}
      viewBox={`0 0 ${w} ${h}`}
    >
      <defs>
        <filter id="ah-glow-sm" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {leftCPs.map((cp, i) => (
        <Ribbon
          key={`l${i}`} cp={cp}
          color={C.purple}
          glowing={appIdx === i && (isToCenter || isRetToApp)}
          particleConfigs={RIBBON_PHASESETS[i % RIBBON_PHASESETS.length]}
        />
      ))}

      {rightCPs.map((cp, i) => (
        <Ribbon
          key={`r${i}`} cp={cp}
          color={PROVIDER_COLORS[i]}
          glowing={provIdx === i && (isToProvider || isRetFromProv)}
          particleConfigs={RIBBON_PHASESETS[(i + 2) % RIBBON_PHASESETS.length]}
        />
      ))}

      {showLeftReq && appIdx < leftCPs.length && (
        <ReqParticle
          key={`req-l-${runKey}`}
          cp={leftCPs[appIdx]}
          reverse={isRetToApp}
          color={C.glow}
          size={5}
          runKey={runKey}
        />
      )}

      {showRightReq && provIdx < rightCPs.length && (
        <ReqParticle
          key={`req-r-${runKey}`}
          cp={rightCPs[provIdx]}
          reverse={isRetFromProv}
          color={PROVIDER_COLORS[provIdx]}
          size={5}
          runKey={runKey}
        />
      )}
    </svg>
  );
}

interface AuraHeroProps {
  className?: string;
}

export default function AuraHero({ className = "" }: AuraHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const centerCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState<Positions | null>(null);
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [appIdx, setAppIdx] = useState(0);
  const [provIdx, setProvIdx] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [activeApp, setActiveApp] = useState<number | null>(null);
  const [activeProv, setActiveProv] = useState<number | null>(null);
  const [centerGlow, setCenterGlow] = useState<"none" | "purple" | "green">("none");
  const [centerStatus, setCenterStatus] = useState<{ show: boolean; isHit: boolean; lines: string[] }>({
    show: false, isHit: false, lines: [],
  });

  const runIdRef = useRef(0);
  const mountedRef = useRef(true);

  const measure = useCallback(() => {
    const cont = containerRef.current;
    const lCard = leftCardRef.current;
    const cCard = centerCardRef.current;
    const rCard = rightCardRef.current;
    if (!cont || !lCard || !cCard || !rCard) return;

    const cR = cont.getBoundingClientRect();
    const rel = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        top: r.top - cR.top,
        left: r.left - cR.left,
        right: r.right - cR.left,
        bottom: r.bottom - cR.top,
        midY: r.top + r.height / 2 - cR.top,
        midX: r.left + r.width / 2 - cR.left,
      };
    };

    const lRows = Array.from(lCard.querySelectorAll("[data-row]")).map(el => {
      const r = rel(el);
      return { rx: r.right, cy: r.midY };
    });

    const rRows = Array.from(rCard.querySelectorAll("[data-row]")).map(el => {
      const r = rel(el);
      return { lx: r.left, cy: r.midY };
    });

    const cc = cCard.getBoundingClientRect();
    const ccTop = cc.top - cR.top;
    const ccBot = cc.bottom - cR.top;
    const ccMidY = (ccTop + ccBot) / 2;

    setPos({
      w: cR.width,
      h: cR.height,
      leftRows: lRows,
      rightRows: rRows,
      centerL: { x: cc.left - cR.left, y: ccMidY },
      centerR: { x: cc.right - cR.left, y: ccMidY },
    });
  }, []);

useEffect(() => {
    mountedRef.current = true;
    measure();
    const obs = new ResizeObserver(measure);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => { mountedRef.current = false; obs.disconnect(); };
  }, [measure]);

  const runCycleRef = useRef<(() => void) | null>(null);

  const runCycle = useCallback(() => {
    if (!mountedRef.current) return;
    const id = ++runIdRef.current;
    const ok = () => mountedRef.current && runIdRef.current === id;

    const isHit = Math.random() > 0.5;
    const app = Math.floor(Math.random() * 3);
    const prov = Math.floor(Math.random() * 4);

    const go = async () => {
      if (!ok()) return;

      setPhase("idle");
      setActiveApp(null);
      setActiveProv(null);
      setCenterGlow("none");
      setCenterStatus({ show: false, isHit: false, lines: [] });
      setAppIdx(app);
      setProvIdx(prov);
      setRunKey(k => k + 1);

      await sleep(600);
      if (!ok()) return;

      setActiveApp(app);
      setPhase("reqToCenter");
      await sleep(1700);
      if (!ok()) return;

      setPhase("atCenter");
      setCenterGlow("purple");
      await sleep(300);
      if (!ok()) return;

      if (isHit) {
        setCenterStatus({ show: true, isHit: true, lines: ["Cache Hit", "92% similarity", "15ms"] });
        setCenterGlow("green");
        await sleep(1800);
        if (!ok()) return;

        setCenterStatus({ show: false, isHit: true, lines: [] });
        setCenterGlow("none");
        setPhase("retToApp");
        await sleep(1700);
        if (!ok()) return;

        setActiveApp(null);
        setPhase("done");

      } else {
        setCenterStatus({ show: true, isHit: false, lines: ["Cache Miss", "Routing…"] });
        await sleep(1100);
        if (!ok()) return;

        setCenterStatus({ show: false, isHit: false, lines: [] });
        setCenterGlow("none");
        setPhase("reqToProvider");
        await sleep(1700);
        if (!ok()) return;

        setActiveProv(prov);
        setPhase("atProvider");
        await sleep(800);
        if (!ok()) return;

        setActiveProv(null);
        setPhase("retFromProvider");
        await sleep(1700);
        if (!ok()) return;

        setCenterGlow("purple");
        setPhase("retToApp");
        await sleep(1700);
        if (!ok()) return;

        setActiveApp(null);
        setCenterGlow("none");
        setPhase("done");
      }

      await sleep(1200);
      if (!ok()) return;
      if (runCycleRef.current) runCycleRef.current();
    };

    go();
  }, []);

  useEffect(() => {
    runCycleRef.current = runCycle;
  }, [runCycle]);

  useEffect(() => {
    const timer = setTimeout(() => runCycle(), 800);
    return () => clearTimeout(timer);
  }, [runCycle]);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1100,
        padding: "48px 32px",
        fontFamily: "'Inter', sans-serif",
      }}
      className={className}
    >
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 55% 45% at 50% 55%, rgba(124,77,255,0.07) 0%, transparent 70%)",
      }} />

      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          width: "100%",
        }}
      >
        <div style={{ flexShrink: 0, width: 210, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: C.muted, marginBottom: 14,
          }}>
            Your Application
          </p>

          <div
            ref={leftCardRef}
            style={{
              width: "100%",
              background: "rgba(13,13,20,0.88)",
              border: "1px solid rgba(124,77,255,0.16)",
              borderRadius: 20, backdropFilter: "blur(28px)",
              boxShadow: "0 0 40px rgba(124,77,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
              padding: 14, display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            {APP_ITEMS.map(({ Icon, label }, i) => (
              <motion.div
                key={label}
                data-row
                animate={{
                  background: activeApp === i ? "rgba(124,77,255,0.22)" : "rgba(255,255,255,0.028)",
                  boxShadow: activeApp === i ? "0 0 22px rgba(124,77,255,0.5)" : "none",
                }}
                whileHover={{ background: "rgba(124,77,255,0.1)" }}
                transition={{ duration: 0.35 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  borderRadius: 12, padding: "11px 14px",
                  border: "1px solid rgba(255,255,255,0.045)",
                  cursor: "default",
                }}
              >
                <Icon size={14} color={C.glow} strokeWidth={2} />
                <span style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 60 }} />

        <div style={{ flexShrink: 0, width: 290, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <motion.div
            ref={centerCardRef}
            animate={{
              boxShadow: centerGlow === "green"
                ? "0 0 70px rgba(48,232,122,0.45), 0 0 130px rgba(48,232,122,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                : centerGlow === "purple"
                ? "0 0 70px rgba(124,77,255,0.45), 0 0 130px rgba(124,77,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                : "0 0 44px rgba(124,77,255,0.14), inset 0 1px 0 rgba(255,255,255,0.04)",
              borderColor: centerGlow === "green"
                ? "rgba(48,232,122,0.45)"
                : centerGlow === "purple"
                ? "rgba(124,77,255,0.45)"
                : "rgba(124,77,255,0.28)",
            }}
            transition={{ duration: 0.55 }}
            style={{
              width: "100%",
              background: "rgba(13,13,20,0.92)",
              border: "1px solid rgba(124,77,255,0.28)",
              borderRadius: 26, backdropFilter: "blur(36px)",
              padding: "30px 26px",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 90% 60% at 50% 30%, rgba(124,77,255,0.09) 0%, transparent 70%)",
            }} />

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 58, height: 58, borderRadius: "50%",
                  background: "linear-gradient(140deg, rgba(124,77,255,0.35), rgba(157,108,255,0.08))",
                  border: "1px solid rgba(124,77,255,0.55)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 32px rgba(124,77,255,0.35)",
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 700, color: C.glow, letterSpacing: "-1px" }}>A</span>
              </motion.div>
            </div>

            <p style={{
              textAlign: "center", fontSize: 20, fontWeight: 700,
              color: C.white, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 14,
            }}>
              AURA PROXY
            </p>

            <AnimatePresence mode="wait">
              {centerStatus.show && (
                <motion.div
                  key="status"
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.9 }}
                  transition={{ duration: 0.28 }}
                  style={{
                    background: centerStatus.isHit ? "rgba(48,232,122,0.1)" : "rgba(124,77,255,0.1)",
                    border: `1px solid ${centerStatus.isHit ? "rgba(48,232,122,0.35)" : "rgba(124,77,255,0.35)"}`,
                    borderRadius: 10, padding: "9px 14px",
                    marginBottom: 14, textAlign: "center",
                  }}
                >
                  {centerStatus.lines.map((line, i) => (
                    <p key={i} style={{
                      fontSize: i === 0 ? 12 : 11,
                      fontWeight: i === 0 ? 700 : 400,
                      color: centerStatus.isHit ? C.green : C.glow,
                      letterSpacing: i === 0 ? "0.06em" : "0.02em",
                      lineHeight: 1.5,
                      margin: 0,
                    }}>
                      {line}
                    </p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {FEATURES.map(({ Icon, label }) => (
                <motion.div
                  key={label}
                  whileHover={{ background: "rgba(124,77,255,0.08)" }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.028)",
                    border: "1px solid rgba(255,255,255,0.045)",
                  }}
                >
                  <Icon size={13} color={C.glow} strokeWidth={2.2} />
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 500, lineHeight: 1 }}>{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div style={{ flex: 1, minWidth: 60 }} />

        <div style={{ flexShrink: 0, width: 210, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: C.muted, marginBottom: 14,
          }}>
            Providers &amp; LLMs
          </p>

          <div
            ref={rightCardRef}
            style={{
              width: "100%",
              background: "rgba(13,13,20,0.88)",
              border: "1px solid rgba(124,77,255,0.16)",
              borderRadius: 20, backdropFilter: "blur(28px)",
              boxShadow: "0 0 40px rgba(124,77,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
              padding: 14, display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            {PROVIDERS.map(({ name, abbr }, i) => {
              const col = PROVIDER_COLORS[i];
              return (
                <motion.div
                  key={name}
                  data-row
                  animate={{
                    background: activeProv === i
                      ? `rgba(${hexToRgb(col)}, 0.18)`
                      : "rgba(255,255,255,0.028)",
                    boxShadow: activeProv === i
                      ? `0 0 22px rgba(${hexToRgb(col)}, 0.55)`
                      : "none",
                  }}
                  whileHover={{ background: `rgba(${hexToRgb(col)}, 0.07)` }}
                  transition={{ duration: 0.35 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    borderRadius: 12, padding: "10px 13px",
                    border: "1px solid rgba(255,255,255,0.045)",
                    cursor: "default",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: `rgba(${hexToRgb(col)}, 0.15)`,
                    border: `1px solid rgba(${hexToRgb(col)}, 0.35)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: col, letterSpacing: "0.03em",
                  }}>
                    {abbr}
                  </div>
                  <span style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{name}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {pos && (
          <RibbonSVG
            pos={pos}
            phase={phase}
            appIdx={appIdx}
            provIdx={provIdx}
            runKey={runKey}
          />
        )}
      </div>

      <AmbientDots />
    </section>
  );
}

const DOTS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: 5 + (i * 71.3) % 92,
  y: 10 + (i * 53.7) % 80,
  size: 1 + (i % 3) * 0.8,
  delay: (i * 0.41) % 3,
  duration: 3 + (i % 4),
}));

function AmbientDots() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {DOTS.map(d => (
        <motion.div
          key={d.id}
          animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.size * 2, height: d.size * 2,
            borderRadius: "50%",
            background: C.purple,
            boxShadow: `0 0 ${d.size * 4}px ${C.purple}`,
          }}
        />
      ))}
    </div>
  );
}