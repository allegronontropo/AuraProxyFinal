"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Globe,
  Smartphone,
  Server,
  Shield,
  LineChart,
  Share2,
  Grid,
  Zap,
  Clock,
  Database
} from "lucide-react";

// --- HOISTED SVG LOGOS ---
const OpenAILogo = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5" aria-hidden="true">
    <rect width="100" height="100" rx="22" fill="#000000" />
    <path
      d="M75.2,52.1c0.4-1.2,0.6-2.5,0.6-3.8c0-5.8-4-10.9-9.5-12.2c0.4-1.5,0.4-3.1,0-4.6c-0.9-3.7-3.4-6.8-6.9-8.4 c-1.2-0.5-2.5-0.9-3.8-1c-2.4-3.8-6.6-6.1-11.1-6.1c-1.3,0-2.6,0.2-3.8,0.6c-1.5-0.4-3.1-0.4-4.6,0C32.4,17.4,29.3,20,27.7,23.5 c-0.5,1.2-0.9,2.5-1,3.8c-3.8,2.4-6.1,6.6-6.1,11.1c0,1.3,0.2,2.6,0.6,3.8c-0.4,1.5-0.4,3.1,0,4.6c0.9,3.7,3.4,6.8,6.9,8.4 c1.2,0.5,2.5,0.9,3.8,1c2.4,3.8,6.6,6.1,11.1,6.1c1.3,0,2.6-0.2,3.8-0.6c1.5,0.4,3.1,0.4,4.6,0c3.7,0.9,6.8,3.4,8.4,6.9 c0.5,1.2,0.9,2.5,1,3.8c3.8-2.4,6.1-6.6,6.1-11.1c0-1.3-0.2-2.6-0.6-3.8C75,55.3,75,53.7,75.2,52.1z"
      fill="#FFFFFF"
    />
  </svg>
);

const AnthropicLogo = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5" aria-hidden="true" fill="none">
    <rect width="100" height="100" rx="22" fill="#000000" />
    <path d="M24 82 L38 22 H54 L68 82 H53 L49 66 H33 L29 82 Z" fill="#FFFFFF" />
    <path d="M35.5 54 H46.5 L41 33 Z" fill="#000000" />
    <path d="M74 82 L86 22 H98 L86 82 Z" fill="#FFFFFF" />
  </svg>
);

const MistralLogo = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5" aria-hidden="true" fill="none">
    <rect x="0" y="0" width="10" height="100" fill="#111827" />
    <rect x="90" y="0" width="10" height="100" fill="#111827" />
    <rect x="10" y="0" width="22" height="22" fill="#FFCB00" />
    <rect x="78" y="0" width="12" height="22" fill="#FF8300" />
    <rect x="10" y="22" width="46" height="22" fill="#FF8300" />
    <rect x="68" y="22" width="22" height="22" fill="#FF4E00" />
    <rect x="10" y="44" width="90" height="22" fill="#FF4E00" />
    <rect x="10" y="66" width="22" height="34" fill="#E60000" />
    <rect x="44" y="66" width="24" height="22" fill="#FF4E00" />
    <rect x="32" y="66" width="12" height="34" fill="#111827" />
    <rect x="68" y="66" width="10" height="34" fill="#111827" />
    <rect x="78" y="66" width="12" height="34" fill="#E60000" />
  </svg>
);

const GeminiLogo = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5" aria-hidden="true" fill="none">
    <defs>
      <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff4e4e" />
        <stop offset="25%" stopColor="#ffb000" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#0080ff" />
      </linearGradient>
    </defs>
    <path
      d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z"
      fill="url(#gemini-grad)"
    />
  </svg>
);

interface AuraProxyLogoProps {
  isActive?: boolean;
  isMatched?: boolean;
}

const AuraProxyLogo: React.FC<AuraProxyLogoProps> = ({ isActive = false, isMatched = false }) => (
  <svg
    viewBox="0 0 200 200"
    className="w-16 h-16 transition-all duration-300 transform scale-110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="a-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="60%" stopColor="#7c5cfc" />
        <stop offset="100%" stopColor="#5b3fd8" />
      </linearGradient>
      <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="50%" stopColor="#7c5cfc" />
        <stop offset="100%" stopColor="#030507" />
      </linearGradient>
      <linearGradient id="match-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="92" fill="#020712"
      stroke={isMatched ? "url(#match-grad)" : "url(#ring-grad)"}
      strokeWidth="3" className="transition-colors duration-300" />
    <circle cx="100" cy="100" r="86"
      stroke={isMatched ? "#10b981" : "#7c5cfc"}
      strokeWidth="1.2" strokeOpacity="0.4" fill="none" />
    <g stroke={isMatched ? "#10b981" : "#a78bfa"} strokeWidth="2" strokeLinecap="round"
      opacity={isActive || isMatched ? "1" : "0.5"} className="transition-opacity duration-300">
      <path d="M 50,75 L 68,75 L 78,85" />
      <circle cx="50" cy="75" r="3" fill={isMatched ? "#34d399" : "#a78bfa"} filter="url(#neon-glow)" />
      <path d="M 32,100 L 50,100 L 58,100" />
      <circle cx="32" cy="100" r="3" fill={isMatched ? "#34d399" : "#a78bfa"} filter="url(#neon-glow)" />
      <path d="M 45,123 L 64,123 L 74,113" />
      <circle cx="45" cy="123" r="3" fill={isMatched ? "#34d399" : "#a78bfa"} filter="url(#neon-glow)" />
    </g>
    <g stroke={isMatched ? "#10b981" : "#a78bfa"} strokeWidth="2" strokeLinecap="round"
      opacity={isActive || isMatched ? "1" : "0.5"} className="transition-opacity duration-300">
      <path d="M 150,75 L 132,75 L 122,85" />
      <circle cx="150" cy="75" r="3" fill={isMatched ? "#34d399" : "#a78bfa"} filter="url(#neon-glow)" />
      <path d="M 168,100 L 150,100 L 142,100" />
      <circle cx="168" cy="100" r="3" fill={isMatched ? "#34d399" : "#a78bfa"} filter="url(#neon-glow)" />
      <path d="M 155,123 L 136,123 L 126,113" />
      <circle cx="155" cy="123" r="3" fill={isMatched ? "#34d399" : "#a78bfa"} filter="url(#neon-glow)" />
    </g>
    <g>
      <path d="M 100,50 L 138,135 H 115 L 100,100 L 85,135 H 62 Z"
        fill={isMatched ? "#10b981" : "#7c5cfc"} opacity="0.15" filter="url(#neon-glow)" />
      <path d="M 100,50 L 138,135 H 115 L 100,100 L 85,135 H 62 Z"
        fill={isMatched ? "url(#match-grad)" : "url(#a-grad)"} className="transition-all duration-300" />
      <path d="M 75,115 Q 100,90 125,115" stroke="#ffffff" strokeWidth="4.5"
        strokeLinecap="round" fill="none" filter="url(#neon-glow)" />
      <circle cx="75" cy="115" r="4.5" fill="#ffffff" filter="url(#neon-glow)" />
      <circle cx="125" cy="115" r="4.5" fill="#ffffff" filter="url(#neon-glow)" />
    </g>
  </svg>
);

export default function AuraProxyHeroVisual() {
  const [time, setTime] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      const marginOffset = window.innerWidth < 645 ? 16 : 48;
      const availableWidth = parentWidth - marginOffset;
      const newScale = Math.min(1.0, availableWidth / 1100);
      setScale(newScale);
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
      lastTime = now;
      setTime((prev) => (prev + delta) % LOOP_DURATION);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const isPhase1 = time < 4000;
  const isPhase2 = time >= 4000;
  const t = time;

  const getBezierPoint = (
    tVal: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ) => {
    const u = 1 - tVal;
    const tt = tVal * tVal;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * tVal;
    return {
      x: uuu * p0.x + 3 * uu * tVal * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * tVal * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    };
  };

  const easeInOutCubic = (x: number): number =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  const getActivePacket = () => {
    if (t >= 0 && t < 1000) {
      const tf = t / 1000;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 280, y: 150 }, { x: 330, y: 150 }, { x: 360, y: 240 }, { x: 410, y: 240 });
      return { ...pt, label: "POST /v1/chat/completions", meta: "Payload Request", badge: "REQ", color: "border-purple-500/80 text-purple-300 bg-slate-950/95 shadow-[0_0_20px_rgba(168,85,247,0.4)]" };
    }
    if (t >= 1200 && t < 2000) {
      const tf = (t - 1200) / 800;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 690, y: 240 }, { x: 740, y: 240 }, { x: 770, y: 120 }, { x: 820, y: 120 });
      return { ...pt, label: "OpenAI: chat/completions", meta: "Cache Miss (Forward)", badge: "MISS", color: "border-orange-500/80 text-orange-400 bg-slate-950/95 shadow-[0_0_20px_rgba(249,115,22,0.4)]" };
    }
    if (t >= 2100 && t < 2850) {
      const tf = (t - 2100) / 750;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 820, y: 120 }, { x: 770, y: 120 }, { x: 740, y: 240 }, { x: 690, y: 240 });
      return { ...pt, label: "HTTP/1.1 200 OK (324ms)", meta: "Provider Response", badge: "RESP", color: "border-emerald-500/70 text-emerald-400 bg-slate-950/95 shadow-[0_0_20px_rgba(16,185,129,0.4)]" };
    }
    if (t >= 2900 && t < 3600) {
      const tf = (t - 2900) / 700;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 410, y: 240 }, { x: 360, y: 240 }, { x: 330, y: 150 }, { x: 280, y: 150 });
      return { ...pt, label: "Delivered & Cached ⚡", meta: "L7 Return Path", badge: "DONE", color: "border-emerald-400 text-emerald-300 bg-[#011d12]/95 shadow-[0_0_25px_rgba(16,185,129,0.5)] font-bold" };
    }
    if (t >= 4000 && t < 5000) {
      const tf = (t - 4000) / 1000;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 280, y: 150 }, { x: 330, y: 150 }, { x: 360, y: 240 }, { x: 410, y: 240 });
      return { ...pt, label: "POST /v1/chat/completions", meta: "Cached Similar Query", badge: "LOOKUP", color: "border-violet-500/85 text-violet-300 bg-slate-950/95 shadow-[0_0_20px_rgba(139,92,246,0.4)]" };
    }
    if (t >= 5100 && t < 5800) {
      const tf = (t - 5100) / 700;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 410, y: 240 }, { x: 360, y: 240 }, { x: 330, y: 150 }, { x: 280, y: 150 });
      return { ...pt, label: "⚡ Cache Hit: 5ms (similarity 92%)", meta: "Aura Instant Return", badge: "HIT", color: "border-emerald-400 text-emerald-300 bg-[#001f13]/95 shadow-[0_0_30px_rgba(52,211,153,0.6)] font-extrabold" };
    }
    return null;
  };

  const activePacket = getActivePacket();

  const p1IncomingRequestGlow = t >= 0 && t < 1000;
  const p1ProxyProcessing = t >= 900 && t < 1500;
  const p1MissBadgeActive = t >= 1000 && t < 3700;
  const p1ForwardingGlow = t >= 1200 && t < 2100;
  const p1OpenAIActive = t >= 1900 && t < 2800;
  const p1ResponseGlow = t >= 2100 && t < 2900;
  const p1LatencyVisible = t >= 2700 && t < 3700;
  const p1FinalBackGlow = t >= 2900 && t < 3600;

  const p2IncomingRequestGlow = t >= 4000 && t < 5000;
  const p2ProxyMatchGlow = t >= 4900 && t < 5600;
  const p2HitBadgeActive = t >= 5000 && t < 7700;
  const p2InstantResponseGlow = t >= 5100 && t < 5800;

  return (
    <div className="w-full select-none flex flex-col items-center justify-center">
      <div
        ref={containerRef}
        className="relative overflow-visible flex items-center justify-center w-full"
        style={{ height: `${540 * scale}px`, transition: "height 0.15s ease-out" }}
      >
        <div
          className="absolute"
          style={{ width: "1100px", height: "540px", transform: `scale(${scale})`, transformOrigin: "center center" }}
        >
          <div className="relative w-[1100px] h-[540px] mx-auto">

            {/* SVG Base Lines */}
            <svg className="absolute inset-0 z-0 w-full h-full" viewBox="0 0 1100 540" fill="none">
              <defs>
                <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
                  <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
                  <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="60%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
                <linearGradient id="emerald-grad" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
                <linearGradient id="miss-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="return-grad" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              {/* Static wires */}
              <path d="M 280,150 C 330,150 360,240 410,240" stroke="rgba(124, 92, 252, 0.25)" strokeWidth="2.5" />
              <path d="M 280,230 C 330,230 360,240 410,240" stroke="rgba(124, 92, 252, 0.35)" strokeWidth="3" />
              <path d="M 280,310 C 330,310 360,240 410,240" stroke="rgba(124, 92, 252, 0.25)" strokeWidth="2.5" />
              <path d="M 690,240 C 740,240 770,120 820,120" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="2.5" />
              <path d="M 690,240 C 740,240 770,190 820,190" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.25" />
              <path d="M 690,240 C 740,240 770,260 820,260" stroke="#0369a1" strokeWidth="1.5" strokeOpacity="0.3" />
              <path d="M 690,240 C 740,240 770,330 820,330" stroke="#7c2d12" strokeWidth="1.5" strokeOpacity="0.25" />

              {/* Phase 1 animated */}
              {isPhase1 && p1IncomingRequestGlow && <path d="M 280,150 C 330,150 360,240 410,240" stroke="url(#purple-grad)" strokeWidth="4" className="glow-line-fast" filter="url(#glow-purple)" />}
              {isPhase1 && p1ForwardingGlow && <path d="M 690,240 C 740,240 770,120 820,120" stroke="url(#miss-grad)" strokeWidth="4" className="glow-line-active" filter="url(#glow-purple)" />}
              {isPhase1 && p1ResponseGlow && <path d="M 820,120 C 770,120 740,240 690,240" stroke="url(#return-grad)" strokeWidth="4" className="glow-line-active" filter="url(#glow-emerald)" />}
              {isPhase1 && p1FinalBackGlow && <path d="M 410,240 C 360,240 330,150 280,150" stroke="url(#emerald-grad)" strokeWidth="5" className="glow-line-fast" filter="url(#glow-emerald)" />}

              {/* Phase 2 animated */}
              {isPhase2 && p2IncomingRequestGlow && <path d="M 280,150 C 330,150 360,240 410,240" stroke="url(#purple-grad)" strokeWidth="4.5" className="glow-line-fast" filter="url(#glow-purple)" />}
              {isPhase2 && p2InstantResponseGlow && <path d="M 410,240 C 360,240 330,150 280,150" stroke="url(#emerald-grad)" strokeWidth="6" className="glow-line-instant" filter="url(#glow-emerald)" />}
            </svg>

            {/* Floating packet bubble */}
            {activePacket && (
              <div
                className={`absolute pointer-events-none z-50 transition-all duration-75 ease-out rounded-xl border px-3.5 py-2 font-mono text-[9.5px] whitespace-nowrap -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 backdrop-blur-md ${activePacket.color}`}
                style={{ left: `${activePacket.x}px`, top: `${activePacket.y}px`, willChange: "transform, left, top" }}
              >
                <div className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                </div>
                <div className="flex flex-col text-left leading-normal">
                  <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center gap-2 leading-none">
                    <span>{activePacket.meta}</span>
                    <span className="opacity-80 px-1 py-[1px] rounded bg-slate-900 border border-slate-800 text-slate-400 font-extrabold">{activePacket.badge}</span>
                  </div>
                  <span className="text-slate-100 font-semibold tracking-tight mt-0.5 max-w-[170px] truncate block">{activePacket.label}</span>
                </div>
              </div>
            )}

            {/* Left: Your Application */}
            <div className="absolute" style={{ top: "80px", left: "40px", width: "240px" }}>
              <div className="backdrop-blur-md rounded-2xl border border-violet-500/15 p-5 shadow-2xl relative overflow-hidden h-[320px] flex flex-col justify-between" style={{background: 'rgba(5,5,7,0.55)'}}>
                <div className="absolute top-0 left-0 w-16 h-[1.5px] bg-gradient-to-r from-violet-500 to-transparent" />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-violet-950/50 p-1.5 rounded-lg border border-violet-800/30">
                      <Database className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-mono tracking-wider text-violet-400 font-bold uppercase">CLIENT ORIGIN</span>
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">YOUR APPLICATION</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: Globe, label: "Web App", active: (isPhase1 && p1IncomingRequestGlow) || (isPhase2 && p2IncomingRequestGlow), done: (isPhase1 && p1FinalBackGlow) || (isPhase2 && p2InstantResponseGlow) },
                      { icon: Smartphone, label: "Mobile App", active: false, done: false },
                      { icon: Server, label: "Backend", active: false, done: false },
                    ].map(({ icon: Icon, label, active, done }) => (
                      <div key={label} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                        active ? "border-violet-500/50 bg-violet-950/10 shadow-[0_0_12px_rgba(168,85,247,0.15)] scale-[1.01]"
                        : done ? "border-emerald-500/50 bg-emerald-950/10"
                        : "bg-slate-900/30 border-slate-800/70"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                            <Icon className={`w-3.5 h-3.5 ${active ? "text-violet-400" : "text-slate-500"}`} />
                          </div>
                          <span className={`text-[11px] font-semibold ${active || done ? "text-slate-200" : "text-slate-400"}`}>{label}</span>
                        </div>
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-violet-500" : "bg-slate-800"}`} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-600 border-t border-slate-900/85 pt-2 text-center uppercase tracking-wider">Secure API Tunnel</div>
              </div>
            </div>

            {/* Top call badge */}
            <div className="absolute" style={{ top: "20px", left: "410px", width: "280px" }}>
              <div className={`border text-center p-3 rounded-2xl backdrop-blur-md transition-all h-[65px] flex flex-col justify-center ${
                p1IncomingRequestGlow || p2IncomingRequestGlow ? "border-violet-500/50" : "border-slate-800/80"
              }`}>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-mono text-violet-400 uppercase tracking-widest font-bold">
                    {isPhase2 ? "SEMANTIC QUERY" : "CLIENT CALL"}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">
                    {isPhase2 ? "Aura Proxy Cache Active" : "Direct Provider Routing"}
                  </span>
                </div>
                <p className="text-[10px] font-mono font-medium text-slate-200 mt-1.5 truncate px-1 text-left">POST /v1/chat/completions</p>
              </div>
            </div>

            {/* Center: Aura Proxy Core */}
            <div className="absolute" style={{ top: "100px", left: "410px", width: "280px" }}>
              <div className={`border rounded-3xl p-6 shadow-2xl transition-all duration-300 relative h-[280px] flex flex-col justify-between backdrop-blur-md ${
                p1ProxyProcessing || p2ProxyMatchGlow
                  ? "border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-[1.02]"
                  : "border-violet-500/40"
              }`} style={{background: p1ProxyProcessing || p2ProxyMatchGlow ? 'rgba(5,5,7,0.7)' : 'rgba(5,5,7,0.6)'}}>
                <div className="flex justify-between items-center relative z-10 w-full">
                  <div className="flex gap-1.5 h-1.5 items-center">
                    <span className={`w-1.5 h-1.5 rounded-full ${p1ProxyProcessing || p2ProxyMatchGlow ? "bg-emerald-400 animate-ping" : "bg-violet-400"}`} />
                    <span className="text-[8px] font-mono tracking-wider text-slate-500 uppercase">PROXY CORE</span>
                  </div>
                  {isPhase2 && p2ProxyMatchGlow && (
                    <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900 font-mono animate-bounce">MATCH 92%</span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center relative z-10 gap-3">
                  <AuraProxyLogo isActive={p1ProxyProcessing} isMatched={p2ProxyMatchGlow} />
                  <div className="text-center">
                    <h3 className="text-base font-bold tracking-[0.24em] text-white">AURA PROXY</h3>
                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">L7 GATEWAY MANAGER</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 border-t border-slate-900/90 pt-3 z-10">
                  {[{ Icon: Grid, label: "Semantic Cache" }, { Icon: Share2, label: "Smart Routing" }, { Icon: LineChart, label: "Observability" }, { Icon: Shield, label: "Guardrails" }].map(({ Icon, label }) => (
                    <div key={label} className="flex flex-col items-center text-center">
                      <Icon className="w-3 h-3 text-violet-400 mb-1" />
                      <span className="text-[7.5px] font-mono text-slate-400 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom state badge */}
            <div className="absolute" style={{ top: "395px", left: "410px", width: "280px" }}>
              {isPhase2 && p2HitBadgeActive ? (
                <div className="bg-slate-950/95 border border-emerald-500/50 rounded-2xl p-3 shadow-3xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-950/40 border border-emerald-800/60 p-2 rounded-xl text-emerald-400">
                      <Zap className="w-4 h-4 fill-emerald-400/20" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block leading-none">CACHE HIT (SMART MATCH)</span>
                      <div className="mt-1.5 flex justify-between items-center text-[10px]">
                        <span className="text-slate-300 font-medium">92% Semantic Similarity</span>
                        <span className="text-emerald-400 font-mono font-bold bg-emerald-950/55 px-1.5 py-0.5 rounded border border-emerald-900/40">5ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isPhase1 && p1MissBadgeActive ? (
                <div className="bg-slate-950/95 border border-red-500/40 rounded-2xl p-3 shadow-3xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-950/40 border border-red-900/60 p-2 rounded-xl text-red-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block leading-none">CACHE MISS (FORWARDING)</span>
                      <div className="mt-1.5 flex justify-between items-center text-[10px]">
                        <span className="text-slate-300 font-semibold">Querying Base Model</span>
                        <span className="text-red-400 font-mono font-bold bg-red-950/55 px-1.5 py-0.5 rounded border border-red-900/40">
                          {p1LatencyVisible ? "324ms" : "Routing..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">COGNITIVE CACHE ENGINE</span>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">Awaiting Query Transmission...</p>
                </div>
              )}
            </div>

            {/* Right: Providers */}
            <div className="absolute" style={{ top: "50px", left: "820px", width: "240px" }}>
              <div className="backdrop-blur-md rounded-2xl border border-violet-500/15 p-5 shadow-2xl relative overflow-hidden h-[420px] flex flex-col justify-between" style={{background: 'rgba(5,5,7,0.55)'}}>
                <div className="absolute top-0 right-0 w-16 h-[1.5px] bg-gradient-to-l from-violet-500 to-transparent" />
                <div>
                  <div className="flex flex-col mb-4 text-left">
                    <span className="text-[9px] font-mono tracking-wider text-violet-400 font-bold uppercase">EXTERNAL INTELLIGENCE</span>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">PROVIDERS &amp; LLMS</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                      isPhase1 && p1OpenAIActive ? "border-emerald-500/50 bg-emerald-950/10 scale-[1.01]" : "bg-slate-900/20 border-slate-800/60"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isPhase1 && p1OpenAIActive ? "text-emerald-300" : "text-slate-600"}`}><OpenAILogo /></div>
                        <span className={`text-[11px] font-semibold ${isPhase1 && p1OpenAIActive ? "text-slate-100" : "text-slate-400"}`}>OpenAI</span>
                      </div>
                      <span className={`text-[8px] font-mono uppercase tracking-wider ${isPhase1 && p1OpenAIActive ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                        {isPhase1 && p1OpenAIActive ? "Querying" : "Idle"}
                      </span>
                    </div>
                    {[{ Logo: AnthropicLogo, name: "Anthropic" }, { Logo: GeminiLogo, name: "Google Gemini" }, { Logo: MistralLogo, name: "Mistral AI" }].map(({ Logo, name }) => (
                      <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/10 border border-slate-900/80 opacity-45">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-950 p-1.5 rounded-lg"><Logo /></div>
                          <span className="text-[11px] font-semibold text-slate-400">{name}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-center p-2 rounded-xl border border-dashed border-slate-900/80 bg-slate-950/20 opacity-30">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">+ Any LLM Gateway</span>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-600 text-center uppercase tracking-widest border-t border-slate-900/90 pt-2">Multi-Model Fallbacks</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
