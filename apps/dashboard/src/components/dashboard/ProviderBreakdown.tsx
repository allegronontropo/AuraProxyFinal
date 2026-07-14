"use client";

import { Server } from "lucide-react";
import { ProviderIcon } from "@/components/ui/provider-icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderStat {
  provider: string;
  _count: { id: number };
  _sum: { costUsd: number | null };
  _avg: { latencyMs: number | null };
}

interface ProviderBreakdownProps {
  providers: ProviderStat[];
}

// ─── Provider color / label map ───────────────────────────────────────────────

const PROVIDER_META: Record<
  string,
  { color: string; bg: string; border: string; initial: string; label: string }
> = {
  openai: {
    color: "#10a37f",
    bg: "rgba(16,163,127,0.12)",
    border: "rgba(16,163,127,0.25)",
    initial: "O",
    label: "OpenAI",
  },
  anthropic: {
    color: "#cc785c",
    bg: "rgba(204,120,92,0.12)",
    border: "rgba(204,120,92,0.25)",
    initial: "A",
    label: "Anthropic",
  },
  mistral: {
    color: "#ff7000",
    bg: "rgba(255,112,0,0.12)",
    border: "rgba(255,112,0,0.25)",
    initial: "M",
    label: "Mistral",
  },
  google: {
    color: "#4285F4",
    bg: "rgba(66,133,244,0.12)",
    border: "rgba(66,133,244,0.25)",
    initial: "G",
    label: "Google",
  },
  cohere: {
    color: "#39594D",
    bg: "rgba(57,89,77,0.25)",
    border: "rgba(57,89,77,0.4)",
    initial: "C",
    label: "Cohere",
  },
  azure: {
    color: "#0078D4",
    bg: "rgba(0,120,212,0.12)",
    border: "rgba(0,120,212,0.25)",
    initial: "Az",
    label: "Azure",
  },
};

function getProviderMeta(provider: string) {
  const key = provider.toLowerCase();
  return (
    PROVIDER_META[key] ?? {
      color: "#9ca3af",
      bg: "rgba(156,163,175,0.1)",
      border: "rgba(156,163,175,0.2)",
      initial: provider.slice(0, 2).toUpperCase(),
      label: provider.charAt(0).toUpperCase() + provider.slice(1),
    }
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-10 px-5 text-center">
      <Server className="w-8 h-8 text-gray-700 opacity-50" />
      <span className="text-[13px] font-medium text-gray-400">No provider data yet</span>
      <span className="text-xs text-gray-500 leading-relaxed max-w-[220px]">
        Provider distribution will appear once you start routing requests
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProviderBreakdown({ providers }: ProviderBreakdownProps) {
  if (!providers || providers.length === 0) {
    return (
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
        <div className="text-[13px] font-semibold text-gray-100">
          Provider Breakdown
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold mb-4">
          Request distribution by AI provider
        </div>
        <EmptyState />
      </div>
    );
  }

  const totalRequests = providers.reduce((s, p) => s + p._count.id, 0);

  return (
    <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col gap-3.5 h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
      {/* Header */}
      <div>
        <div className="text-[13px] font-semibold text-gray-100">Provider Breakdown</div>
        <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">
          {totalRequests.toLocaleString()} total requests across {providers.length} provider
          {providers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Provider rows */}
      <div className="flex flex-col gap-3">
        {providers.map((p) => {
          const meta = getProviderMeta(p.provider);
          const pct = totalRequests > 0 ? (p._count.id / totalRequests) * 100 : 0;
          const avgLatency = p._avg.latencyMs ?? 0;
          const totalCost = p._sum.costUsd ?? 0;

          return (
            <div key={p.provider}>
              {/* Provider header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      color: meta.color,
                    }}
                  >
                    <ProviderIcon provider={p.provider} size={16} type="color" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-100">
                      {meta.label}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {p._count.id.toLocaleString()} req · {Math.round(avgLatency)}ms avg
                    </div>
                  </div>
                </div>

                {/* Right stats */}
                <div className="text-right">
                  <div className="text-xs font-semibold" style={{ color: meta.color }}>
                    {pct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    ${totalCost.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer legend */}
      <div className="pt-3 mt-auto border-t border-white/5 flex flex-wrap gap-x-4 gap-y-2">
        {providers.map((p) => {
          const meta = getProviderMeta(p.provider);
          return (
            <div key={p.provider} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: meta.color }}
              />
              <span className="text-[10px] text-gray-500">{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
