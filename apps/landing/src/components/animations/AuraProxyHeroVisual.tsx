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
  <svg viewBox="0 0 100 100" className="w-6 h-6" aria-hidden="true">
    <rect width="100" height="100" rx="24" fill="#10a37f" fillOpacity="0.15" stroke="#10a37f" strokeOpacity="0.25" strokeWidth="1.5" />
    <path
      d="M75.2,52.1c0.4-1.2,0.6-2.5,0.6-3.8c0-5.8-4-10.9-9.5-12.2c0.4-1.5,0.4-3.1,0-4.6c-0.9-3.7-3.4-6.8-6.9-8.4 c-1.2-0.5-2.5-0.9-3.8-1c-2.4-3.8-6.6-6.1-11.1-6.1c-1.3,0-2.6,0.2-3.8,0.6c-1.5-0.4-3.1-0.4-4.6,0C32.4,17.4,29.3,20,27.7,23.5 c-0.5,1.2-0.9,2.5-1,3.8c-3.8,2.4-6.1,6.6-6.1,11.1c0,1.3,0.2,2.6,0.6,3.8c-0.4,1.5-0.4,3.1,0,4.6c0.9,3.7,3.4,6.8,6.9,8.4 c1.2,0.5,2.5,0.9,3.8,1c2.4,3.8,6.6,6.1,11.1,6.1c1.3,0,2.6-0.2,3.8-0.6c1.5,0.4,3.1,0.4,4.6,0c3.7,0.9,6.8,3.4,8.4,6.9 c0.5,1.2,0.9,2.5,1,3.8c3.8-2.4,6.1-6.6,6.1-11.1c0-1.3-0.2-2.6-0.6-3.8C75,55.3,75,53.7,75.2,52.1z"
      fill="#10a37f"
    />
  </svg>
);

const AnthropicLogo = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" aria-hidden="true" fill="none">
    <rect width="100" height="100" rx="24" fill="#cc785c" fillOpacity="0.15" stroke="#cc785c" strokeOpacity="0.25" strokeWidth="1.5" />
    <path d="M24 82 L38 22 H54 L68 82 H53 L49 66 H33 L29 82 Z" fill="#cc785c" />
    <path d="M35.5 54 H46.5 L41 33 Z" fill="#ffffff" fillOpacity="0.9" />
    <path d="M74 82 L86 22 H98 L86 82 Z" fill="#cc785c" />
  </svg>
);

const GeminiLogo = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" aria-hidden="true" fill="none">
    <defs>
      <linearGradient id="gemini-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9bc5ff" />
        <stop offset="35%" stopColor="#e879f9" />
        <stop offset="70%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#ffb000" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="24" fill="url(#gemini-icon-grad)" fillOpacity="0.12" stroke="url(#gemini-icon-grad)" strokeOpacity="0.25" strokeWidth="1.5" />
    <path
      d="M50 15 C50 40 60 50 85 50 C60 50 50 60 50 85 C50 60 40 50 15 50 C40 50 50 40 50 15 Z"
      fill="url(#gemini-icon-grad)"
    />
  </svg>
);

const MistralLogo = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" aria-hidden="true" fill="none">
    <rect width="100" height="100" rx="24" fill="#ff4e00" fillOpacity="0.12" stroke="#ff4e00" strokeOpacity="0.2" strokeWidth="1.5" />
    <g transform="scale(0.7) translate(22, 22)">
      <rect x="0" y="0" width="10" height="100" fill="#ff4e00" />
      <rect x="90" y="0" width="10" height="100" fill="#ff4e00" />
      <rect x="10" y="0" width="22" height="22" fill="#FFCB00" />
      <rect x="78" y="0" width="12" height="22" fill="#FF8300" />
      <rect x="10" y="22" width="46" height="22" fill="#FF8300" />
      <rect x="68" y="22" width="22" height="22" fill="#FF4E00" />
      <rect x="10" y="44" width="90" height="22" fill="#FF4E00" />
      <rect x="10" y="66" width="22" height="34" fill="#E60000" />
      <rect x="44" y="66" width="24" height="22" fill="#FF4E00" />
      <rect x="32" y="66" width="12" height="34" fill="rgba(255,255,255,0.05)" />
      <rect x="68" y="66" width="10" height="34" fill="rgba(255,255,255,0.05)" />
      <rect x="78" y="66" width="12" height="34" fill="#E60000" />
    </g>
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
    style={{ fill: "none" }}
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
    <circle cx="100" cy="100" r="92" style={{ fill: "#020712" }}
      stroke={isMatched ? "url(#match-grad)" : "url(#ring-grad)"}
      strokeWidth="3" className="transition-colors duration-300" />
    <circle cx="100" cy="100" r="86"
      stroke={isMatched ? "#10b981" : "#7c5cfc"}
      strokeWidth="1.2" strokeOpacity="0.4" style={{ fill: "none" }} />
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
        strokeLinecap="round" style={{ fill: "none" }} filter="url(#neon-glow)" />
      <circle cx="75" cy="115" r="4.5" style={{ fill: "#ffffff" }} filter="url(#neon-glow)" />
      <circle cx="125" cy="115" r="4.5" style={{ fill: "#ffffff" }} filter="url(#neon-glow)" />
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
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 280, y: 120 }, { x: 330, y: 120 }, { x: 360, y: 240 }, { x: 410, y: 240 });
      return { ...pt, label: "POST /v1/chat/completions", meta: "Payload Request", badge: "REQ", color: "border-purple-500/80 text-purple-300 bg-slate-950/95 shadow-[0_0_20px_rgba(168,85,247,0.4)]" };
    }
    if (t >= 1200 && t < 2000) {
      const tf = (t - 1200) / 800;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 690, y: 240 }, { x: 740, y: 240 }, { x: 770, y: 90 }, { x: 820, y: 90 });
      return { ...pt, label: "OpenAI: chat/completions", meta: "Cache Miss (Forward)", badge: "MISS", color: "border-orange-500/80 text-orange-400 bg-slate-950/95 shadow-[0_0_20px_rgba(249,115,22,0.4)]" };
    }
    if (t >= 2100 && t < 2850) {
      const tf = (t - 2100) / 750;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 820, y: 90 }, { x: 770, y: 90 }, { x: 740, y: 240 }, { x: 690, y: 240 });
      return { ...pt, label: "HTTP/1.1 200 OK (324ms)", meta: "Provider Response", badge: "RESP", color: "border-emerald-500/70 text-emerald-400 bg-slate-950/95 shadow-[0_0_20px_rgba(16,185,129,0.4)]" };
    }
    if (t >= 2900 && t < 3600) {
      const tf = (t - 2900) / 700;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 410, y: 240 }, { x: 360, y: 240 }, { x: 330, y: 120 }, { x: 280, y: 120 });
      return { ...pt, label: "Delivered & Cached ⚡", meta: "L7 Return Path", badge: "DONE", color: "border-emerald-400 text-emerald-300 bg-[#011d12]/95 shadow-[0_0_25px_rgba(16,185,129,0.5)] font-bold" };
    }
    if (t >= 4000 && t < 5000) {
      const tf = (t - 4000) / 1000;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 280, y: 120 }, { x: 330, y: 120 }, { x: 360, y: 240 }, { x: 410, y: 240 });
      return { ...pt, label: "POST /v1/chat/completions", meta: "Cached Similar Query", badge: "LOOKUP", color: "border-violet-500/85 text-violet-300 bg-slate-950/95 shadow-[0_0_20px_rgba(139,92,246,0.4)]" };
    }
    if (t >= 5100 && t < 5800) {
      const tf = (t - 5100) / 700;
      const pt = getBezierPoint(easeInOutCubic(tf), { x: 410, y: 240 }, { x: 360, y: 240 }, { x: 330, y: 120 }, { x: 280, y: 120 });
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

  const isMissState = t >= 1000 && t < 2900;
  const isHitState = t >= 5000 && t < 7700;

  const cacheActive = (t >= 0 && t < 1000) || (t >= 2900 && t < 3600) || (t >= 4000 && t < 5800);
  const cacheDone = (t >= 5100 && t < 5800) || (t >= 2900 && t < 3600);
  const routingActive = (t >= 1000 && t < 2900);
  const routingDone = (t >= 2100 && t < 2900);
  const obsActive = (t >= 2100 && t < 3600) || (t >= 5100 && t < 5800);
  const guardActive = (t >= 0 && t < 1500) || (t >= 4000 && t < 5100);

  return (
    <div className="w-full select-none flex flex-col items-center justify-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes panGrid {
          0% { background-position: 0px 0px; }
          100% { background-position: 32px 32px; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(124, 92, 252, 0.35)); }
          50% { filter: drop-shadow(0 0 22px rgba(124, 92, 252, 0.65)); }
        }
        @keyframes waveFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -300; }
        }
        @keyframes equalizerBar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1.0); }
        }
      `}} />
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
            <svg className="absolute inset-0 z-0 w-full h-full" viewBox="0 0 1100 540" style={{ fill: "none" }}>
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
              <path d="M 280,120 C 330,120 360,240 410,240" stroke="rgba(124, 92, 252, 0.25)" strokeWidth="2.5" />
              <path d="M 280,230 C 330,230 360,240 410,240" stroke="rgba(124, 92, 252, 0.35)" strokeWidth="3" />
              <path d="M 280,340 C 330,340 360,240 410,240" stroke="rgba(124, 92, 252, 0.25)" strokeWidth="2.5" />
              <path d="M 690,240 C 740,240 770,90 820,90" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="2.5" />
              <path d="M 690,240 C 740,240 770,190 820,190" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.25" />
              <path d="M 690,240 C 740,240 770,290 820,290" stroke="#0369a1" strokeWidth="1.5" strokeOpacity="0.3" />
              <path d="M 690,240 C 740,240 770,390 820,390" stroke="#7c2d12" strokeWidth="1.5" strokeOpacity="0.25" />

              {/* Phase 1 animated */}
              {isPhase1 && p1IncomingRequestGlow && <path d="M 280,120 C 330,120 360,240 410,240" stroke="url(#purple-grad)" strokeWidth="4" className="glow-line-fast" filter="url(#glow-purple)" />}
              {isPhase1 && p1ForwardingGlow && <path d="M 690,240 C 740,240 770,90 820,90" stroke="url(#miss-grad)" strokeWidth="4" className="glow-line-active" filter="url(#glow-purple)" />}
              {isPhase1 && p1ResponseGlow && <path d="M 820,90 C 770,90 740,240 690,240" stroke="url(#return-grad)" strokeWidth="4" className="glow-line-active" filter="url(#glow-emerald)" />}
              {isPhase1 && p1FinalBackGlow && <path d="M 410,240 C 360,240 330,120 280,120" stroke="url(#emerald-grad)" strokeWidth="5" className="glow-line-fast" filter="url(#glow-emerald)" />}

              {/* Phase 2 animated */}
              {isPhase2 && p2IncomingRequestGlow && <path d="M 280,120 C 330,120 360,240 410,240" stroke="url(#purple-grad)" strokeWidth="4.5" className="glow-line-fast" filter="url(#glow-purple)" />}
              {isPhase2 && p2InstantResponseGlow && <path d="M 410,240 C 360,240 330,120 280,120" stroke="url(#emerald-grad)" strokeWidth="6" className="glow-line-instant" filter="url(#glow-emerald)" />}
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

            {/* Left: Your Application (Independent Glassmorphic Tiles) */}
            {[
              { 
                icon: Globe, 
                label: "Web Application", 
                subtitle: "https://api.aura.dev", 
                metric: "HTTP/1.1",
                yPos: 120, 
                active: (isPhase1 && p1IncomingRequestGlow) || (isPhase2 && p2IncomingRequestGlow), 
                done: (isPhase1 && p1FinalBackGlow) || (isPhase2 && p2InstantResponseGlow) 
              },
              { 
                icon: Smartphone, 
                label: "Mobile Client", 
                subtitle: "iOS / Swift SDK", 
                metric: "JSON",
                yPos: 230, 
                active: false, 
                done: false 
              },
              { 
                icon: Server, 
                label: "Backend Service", 
                subtitle: "Go / gRPC Server", 
                metric: "gRPC",
                yPos: 340, 
                active: false, 
                done: false 
              },
            ].map(({ icon: Icon, label, subtitle, metric, yPos, active, done }) => (
              <div
                key={label}
                className={`absolute left-[5px] w-[275px] h-[80px] -translate-y-1/2 rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden flex items-center justify-between px-4 group ${
                  active 
                    ? "bg-violet-950/20 border-violet-500/80 shadow-[0_0_25px_rgba(124,92,252,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] scale-[1.03]" 
                    : done 
                    ? "bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]"
                    : "bg-slate-950/45 border-slate-900/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-800/80 hover:bg-slate-950/60"
                }`}
                style={{ top: `${yPos}px` }}
              >
                {/* Tech grid texture inside tile */}
                <div 
                  className="absolute inset-0 opacity-[0.07] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.12]" 
                  style={{
                    backgroundImage: `radial-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 0), radial-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 0)`,
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px',
                  }}
                />
                
                {/* Shimmer/Glow overlay for active cards */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full transition-transform duration-1000 ${active ? "animate-[shimmer_2s_infinite]" : ""}`} />

                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    active 
                      ? "bg-violet-950/40 border-violet-500/40 text-violet-300" 
                      : done 
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-900/60 border-slate-800/70 text-slate-400"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-[13px] font-extrabold tracking-tight transition-colors duration-300 ${
                      active || done ? "text-slate-105 font-black" : "text-slate-200"
                    }`}>{label}</span>
                    <span className="text-[10px] font-mono text-slate-450 font-bold tracking-tight mt-0.5">{subtitle}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 relative z-10 pr-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors duration-300 ${
                    active 
                      ? "bg-violet-950/60 border-violet-800/50 text-violet-300 font-bold" 
                      : done 
                      ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-300 font-bold"
                      : "bg-slate-900/40 border-slate-800/60 text-slate-500 font-semibold"
                  }`}>{active ? "ACTIVE" : done ? "DONE" : metric}</span>
                </div>

                {/* Pulse Wire Endpoint Connector Dot */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center z-20">
                  <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${
                    active 
                      ? "bg-violet-400 border-violet-300 shadow-[0_0_12px_#a855f7]" 
                      : done 
                      ? "bg-emerald-400 border-emerald-300 shadow-[0_0_12px_#10b981]"
                      : "bg-slate-800 border-slate-700"
                  }`} />
                </div>
              </div>
            ))}

            {/* Top call badge: Pipeline Gate */}
            <div className="absolute" style={{ top: "20px", left: "410px", width: "280px" }}>
              <div className={`border bg-slate-950/85 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden h-[65px] px-4 flex items-center justify-between transition-all duration-500 ${
                p1IncomingRequestGlow || p2IncomingRequestGlow ? "border-violet-500/60 shadow-[0_0_15px_rgba(124,92,252,0.15)]" : "border-slate-900/90"
              }`}>
                {/* Tech background pattern */}
                <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#a855f7_1px,transparent_1px)] bg-[size:10px_10px]" />
                
                <div className="flex items-center gap-3 relative z-10">
                  {/* Glowing Status Dot */}
                  <div className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      p1IncomingRequestGlow || p2IncomingRequestGlow ? "bg-violet-400" : "bg-slate-700"
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      p1IncomingRequestGlow || p2IncomingRequestGlow ? "bg-violet-500" : "bg-slate-800"
                    }`} />
                  </div>
                  
                  {/* Route Label */}
                  <div className="flex flex-col text-left">
                    <span className="text-[7.5px] font-bold font-mono tracking-widest text-slate-500 uppercase">GATEWAY REQUEST</span>
                    <span className="text-[11px] font-mono font-bold text-slate-200 tracking-tight mt-0.5">POST /v1/chat</span>
                  </div>
                </div>

                {/* Animated Equalizer Meter */}
                <div className="flex items-end gap-[3px] h-5 relative z-10">
                  {[0.4, 0.7, 0.5, 0.9, 0.3].map((val, index) => (
                    <div 
                      key={index} 
                      className={`w-[3px] rounded-full transition-all duration-300 ${
                        p1IncomingRequestGlow || p2IncomingRequestGlow ? "bg-violet-500" : "bg-slate-800"
                      }`}
                      style={{
                        height: `${val * 100}%`,
                        animation: p1IncomingRequestGlow || p2IncomingRequestGlow 
                          ? `equalizerBar ${0.6 + index * 0.1}s ease-in-out infinite alternate` 
                          : "none",
                        transformOrigin: "bottom"
                      }}
                    />
                  ))}
                </div>

                {/* Method Pill */}
                <div className="relative z-10">
                  <span className={`text-[8.5px] px-2 py-0.5 rounded-md font-extrabold border transition-all duration-300 ${
                    p1FinalBackGlow || p2InstantResponseGlow 
                      ? "bg-emerald-950/60 border-emerald-800/60 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : p1IncomingRequestGlow || p2IncomingRequestGlow 
                      ? "bg-violet-950/60 border-violet-800/60 text-violet-400"
                      : "bg-slate-900/40 border-slate-800/60 text-slate-500"
                  }`}>
                    {p1FinalBackGlow || p2InstantResponseGlow ? "200 OK" : "HTTPS"}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Aura Proxy Core */}
            <div className="absolute" style={{ top: "100px", left: "410px", width: "280px" }}>
              <div className={`bg-slate-950/90 border rounded-3xl p-5 shadow-2xl transition-all duration-500 relative h-[280px] flex flex-col justify-between overflow-hidden group ${
                p1ProxyProcessing || p2ProxyMatchGlow
                  ? "border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.25)] scale-[1.01]"
                  : "border-violet-500/50 shadow-[0_0_30px_rgba(124,92,252,0.08)]"
              }`}>
                {/* Engineering moving grid overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.05] pointer-events-none transition-opacity duration-300" 
                  style={{
                    backgroundImage: `linear-gradient(rgba(124, 92, 252, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 92, 252, 0.25) 1px, transparent 1px)`,
                    backgroundSize: '16px 16px',
                    animation: 'panGrid 25s linear infinite',
                  }}
                />

                <div className="flex justify-between items-center relative z-10 w-full">
                  <div className="flex gap-1.5 h-2 items-center">
                    <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      p1ProxyProcessing || p2ProxyMatchGlow 
                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" 
                        : "bg-violet-400 shadow-[0_0_8px_#a855f7]"
                    }`} />
                    <span className="text-[8px] font-mono tracking-wider text-slate-500 uppercase font-bold">PROXY CORE</span>
                  </div>
                  {isPhase2 && p2ProxyMatchGlow && (
                    <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/80 font-mono animate-pulse">MATCH 92%</span>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center relative z-10 gap-2.5">
                  <div className={p1ProxyProcessing || p2ProxyMatchGlow ? "animate-[pulseGlow_2s_infinite]" : ""}>
                    <AuraProxyLogo isActive={p1ProxyProcessing} isMatched={p2ProxyMatchGlow} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-bold tracking-[0.24em] text-white">AURA PROXY</h3>
                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1">L7 GATEWAY ENGINE</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 border-t border-slate-900/90 pt-4 z-10">
                  {[
                    { Icon: Grid, label: "Semantic Cache", active: cacheActive, done: cacheDone },
                    { Icon: Share2, label: "Smart Routing", active: routingActive, done: routingDone },
                    { Icon: LineChart, label: "Observability", active: obsActive, done: false },
                    { Icon: Shield, label: "Guardrails", active: guardActive, done: false },
                  ].map(({ Icon, label, active, done }) => (
                    <div 
                      key={label} 
                      className={`flex flex-col items-center text-center p-1 rounded-lg border transition-all duration-305 ${
                        active 
                          ? done
                            ? "bg-emerald-950/15 border-emerald-500/40 scale-[1.03]"
                            : "bg-violet-950/15 border-violet-500/40 scale-[1.03]"
                          : "bg-transparent border-transparent"
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] mb-1.5 transition-colors duration-300 ${
                        active 
                          ? done ? "text-emerald-400" : "text-violet-400" 
                          : "text-slate-650"
                      }`} />
                      <span className={`text-[9.5px] font-extrabold font-mono tracking-tight leading-tight transition-colors duration-300 ${
                        active 
                          ? done ? "text-emerald-300" : "text-violet-300" 
                          : "text-slate-500"
                      }`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Cognitive Cache Engine (Waveform Matcher) */}
            <div className="absolute" style={{ top: "395px", left: "410px", width: "280px" }}>
              <div className={`border bg-slate-950/95 rounded-2xl p-4 shadow-3xl backdrop-blur-md h-[115px] flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                isHitState ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "border-slate-900/90"
              }`}>
                {/* Visualizer header */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-[7.5px] font-mono tracking-widest text-slate-500 font-bold uppercase">SEMANTIC SIGNAL WAVEFORM</span>
                  <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
                    isHitState ? "text-emerald-450 bg-emerald-950/50" : isMissState ? "text-orange-455 bg-orange-950/50" : "text-slate-550"
                  }`}>
                    {isHitState ? "MATCHED" : isMissState ? "MISSED" : "STANDBY"}
                  </span>
                </div>
                
                {/* Animated Waveform Screen */}
                <div className="h-10 w-full relative flex items-center justify-center bg-slate-950/60 border border-slate-900/65 rounded-lg overflow-hidden my-1.5">
                  {/* Screen fine grid lines */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:8px_8px]" />
                  
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 250 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="wave-purple-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(168, 85, 247, 0)" />
                        <stop offset="50%" stopColor="rgba(168, 85, 247, 0.6)" />
                        <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                      </linearGradient>
                      <linearGradient id="wave-emerald-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
                        <stop offset="50%" stopColor="rgba(16, 185, 129, 0.9)" />
                        <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                      </linearGradient>
                      <linearGradient id="wave-red-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(249, 115, 22, 0)" />
                        <stop offset="50%" stopColor="rgba(249, 115, 22, 0.7)" />
                        <stop offset="100%" stopColor="rgba(249, 115, 22, 0)" />
                      </linearGradient>
                    </defs>

                    {/* Standard template background wave */}
                    <path 
                      d="M 0 20 Q 62.5 5, 125 20 T 250 20" 
                      stroke="rgba(168, 85, 247, 0.25)" 
                      strokeWidth="1.5" 
                      fill="none" 
                    />

                    {isHitState ? (
                      <>
                        {/* Synced Glowing Emerald Wave */}
                        <path 
                          d="M 0 20 Q 62.5 5, 125 20 T 250 20" 
                          stroke="url(#wave-emerald-grad)" 
                          strokeWidth="2.5" 
                          fill="none" 
                          style={{
                            strokeDasharray: "150",
                            animation: "waveFlow 2.5s linear infinite"
                          }}
                        />
                        <path 
                          d="M 0 20 Q 62.5 5, 125 20 T 250 20" 
                          stroke="rgba(16, 185, 129, 0.25)" 
                          strokeWidth="6" 
                          fill="none" 
                        />
                      </>
                    ) : isMissState ? (
                      <>
                        {/* Chaotic Out of Sync Wave */}
                        <path 
                          d="M 0 20 L 25 10 L 50 30 L 75 5 L 100 35 L 125 15 L 150 25 L 175 10 L 200 30 L 225 15 L 250 20" 
                          stroke="url(#wave-red-grad)" 
                          strokeWidth="2" 
                          fill="none" 
                          style={{
                            strokeDasharray: "200",
                            animation: "waveFlow 4s linear infinite"
                          }}
                        />
                      </>
                    ) : (
                      <>
                        {/* Calm Violet Ripple Wave */}
                        <path 
                          d="M 0 20 Q 62.5 12, 125 20 T 250 20" 
                          stroke="url(#wave-purple-grad)" 
                          strokeWidth="1.5" 
                          fill="none" 
                          style={{
                            strokeDasharray: "120",
                            animation: "waveFlow 5s linear infinite"
                          }}
                        />
                      </>
                    )}
                  </svg>
                  
                  {/* Floating match badge */}
                  <span className="absolute text-[8px] font-mono bg-slate-950/80 border border-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-bold backdrop-blur-sm scale-90">
                    {isHitState ? "MATCH: 92.4%" : isMissState ? "MATCH: 74.0%" : "SCANNING..."}
                  </span>
                </div>

                {/* Diagnostic readout metrics */}
                <div className="flex justify-between items-center text-[9px] font-mono font-medium px-0.5">
                  {isHitState ? (
                    <>
                      <span className="text-emerald-400 font-bold">⚡ Instant Cache Hit</span>
                      <span className="text-slate-500">Latency: <strong className="text-emerald-400 font-bold">5ms</strong> (saved 319ms)</span>
                    </>
                  ) : isMissState ? (
                    <>
                      <span className="text-orange-450 font-bold">⚠️ Cache Miss / Forward</span>
                      <span className="text-slate-500">Latency: <strong className="text-slate-400 font-bold">324ms</strong></span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-500 font-semibold uppercase tracking-tight">Cognitive Matcher Standby</span>
                      <span className="text-slate-600">Awaiting Payload...</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Providers (Independent Glassmorphic Tiles) */}
            {[
              { 
                Logo: OpenAILogo, 
                name: "OpenAI GPT-4o", 
                subtitle: "openai.com / chat", 
                latency: isPhase1 && p1LatencyVisible ? "324ms" : isPhase1 && p1OpenAIActive ? "Querying..." : "Standby",
                yPos: 90, 
                active: isPhase1 && p1OpenAIActive 
              },
              { 
                Logo: AnthropicLogo, 
                name: "Claude 3.5 Sonnet", 
                subtitle: "anthropic.com / api", 
                latency: "Ready",
                yPos: 190, 
                active: false 
              },
              { 
                Logo: GeminiLogo, 
                name: "Google Gemini 1.5", 
                subtitle: "gemini.google.com", 
                latency: "Ready",
                yPos: 290, 
                active: false 
              },
              { 
                Logo: MistralLogo, 
                name: "Mistral Large", 
                subtitle: "mistral.ai / platform", 
                latency: "Ready",
                yPos: 390, 
                active: false 
              },
            ].map(({ Logo, name, subtitle, latency, yPos, active }) => (
              <div
                key={name}
                className={`absolute left-[820px] w-[275px] h-[80px] -translate-y-1/2 rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden flex items-center justify-between px-4 group ${
                  active 
                    ? "bg-emerald-950/20 border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] scale-[1.03]" 
                    : "bg-slate-950/45 border-slate-900/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-800/80 hover:bg-slate-950/60"
                }`}
                style={{ top: `${yPos}px` }}
              >
                {/* Tech grid texture inside tile */}
                <div 
                  className="absolute inset-0 opacity-[0.07] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.12]" 
                  style={{
                    backgroundImage: `radial-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 0), radial-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 0)`,
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px',
                  }}
                />

                {/* Shimmer/Glow overlay for active cards */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full transition-transform duration-1000 ${active ? "animate-[shimmer_2s_infinite]" : ""}`} />

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300">
                    <Logo />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-[13px] font-extrabold tracking-tight transition-colors duration-300 ${
                      active ? "text-slate-105 font-black" : "text-slate-200"
                    }`}>{name}</span>
                    <span className="text-[10px] font-mono text-slate-450 font-bold tracking-tight mt-0.5">{subtitle}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 relative z-10 pr-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors duration-300 ${
                    active 
                      ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-300 font-bold" 
                      : "bg-slate-900/40 border-slate-800/60 text-slate-500 font-semibold"
                  }`}>{latency}</span>
                </div>

                {/* Pulse Wire Endpoint Connector Dot */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center z-20">
                  <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${
                    active 
                      ? "bg-emerald-400 border-emerald-300 shadow-[0_0_12px_#10b981]" 
                      : "bg-slate-800 border-slate-700"
                  }`} />
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}

