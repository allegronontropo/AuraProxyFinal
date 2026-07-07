"use client";

import { useState } from "react";
import { ListIcon } from "lucide-react";
import { ProviderIcon } from "@lobehub/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestLog {
  id: string;
  provider: string;
  model: string;
  latencyMs: number | null;
  costUsd: number | null;
  cached: boolean;
  statusCode: number | null;
  createdAt: Date | string;
  apiKey: { name: string; keyPrefix?: string } | null;
}

interface RecentActivityProps {
  logs: RequestLog[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const ts = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((now - ts) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getStatusColorClass(code: number | null): string {
  if (!code) return "bg-gray-500 shadow-gray-500/50";
  if (code < 300) return "bg-emerald-400 shadow-emerald-400/50";
  if (code < 500) return "bg-amber-400 shadow-amber-400/50";
  return "bg-red-500 shadow-red-500/50";
}

function getLatencyColorClass(ms: number | null): string {
  if (!ms) return "text-gray-500";
  if (ms < 200) return "text-emerald-400";
  if (ms < 500) return "text-amber-400";
  return "text-red-500";
}

function truncateModel(model: string): string {
  if (model.length <= 24) return model;
  return model.slice(0, 22) + "…";
}

function formatProvider(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-6 text-center">
      <ListIcon className="w-8 h-8 text-gray-700 opacity-50" />
      <div className="text-[13px] font-medium text-gray-400">No requests yet</div>
      <div className="text-xs text-gray-500 leading-relaxed max-w-[260px]">
        Start using your proxy endpoint and requests will appear here in real-time.
      </div>
      <code className="text-[10px] text-gray-500 bg-white/[0.04] border border-white/[0.07] rounded-md px-2.5 py-1 mt-1 font-mono">
        POST https://proxy.aura.dev/v1/chat/completions
      </code>
    </div>
  );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log, isExpanded, onToggle }: { log: RequestLog; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="border-b border-white/[0.04] cursor-pointer transition-colors duration-150 hover:bg-white/[0.02]"
    >
      {/* Main row */}
      <div className="flex items-center gap-2.5 px-1 py-2.5">
        {/* Status dot */}
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_4px] ${getStatusColorClass(log.statusCode)}`} />

        {/* Model + Provider */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
            {truncateModel(log.model)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5">
            <ProviderIcon provider={log.provider} size={12} type="color" />
            {formatProvider(log.provider)}
            {log.apiKey && <span className="text-gray-600"> · {log.apiKey.name}</span>}
          </div>
        </div>

        {/* Cached badge */}
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] border tracking-wider shrink-0 ${
          log.cached 
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
            : "bg-white/[0.04] border-white/[0.07] text-gray-500"
        }`}>
          {log.cached ? "HIT" : "MISS"}
        </span>

        {/* Latency */}
        <div className={`text-[11px] font-medium min-w-[44px] text-right shrink-0 ${getLatencyColorClass(log.latencyMs)}`}>
          {log.latencyMs != null ? `${log.latencyMs}ms` : "—"}
        </div>

        {/* Cost */}
        <div className="text-[11px] text-gray-400 min-w-[48px] text-right shrink-0">
          {log.costUsd != null ? `$${Number(log.costUsd).toFixed(5)}` : "—"}
        </div>

        {/* Time ago */}
        <div suppressHydrationWarning className="text-[10px] text-gray-500 min-w-[48px] text-right shrink-0">
          {timeAgo(log.createdAt)}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 py-2.5 pb-3 bg-violet-500/[0.04] border-t border-violet-500/[0.12]">
          <div className="flex gap-6 flex-wrap">
            {[
              { label: "Request ID", value: log.id.slice(0, 12) + "…" },
              { label: "Status Code", value: String(log.statusCode ?? "—") },
              { label: "Provider", value: formatProvider(log.provider) },
              { label: "Model", value: log.model },
              { label: "Latency", value: log.latencyMs ? `${log.latencyMs}ms` : "—" },
              { label: "Cost", value: log.costUsd ? `$${Number(log.costUsd).toFixed(6)}` : "—" },
              { label: "Saved to Cache", value: !log.cached ? "Yes" : "No (Served from cache)" },
              {
                label: "Time",
                value: new Date(log.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold">
                  {label}
                </div>
                <div className="text-[11px] text-gray-300 mt-0.5 font-mono">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecentActivity({ logs }: RecentActivityProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[13px] font-semibold text-gray-100">Recent Activity</div>
          <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">
            Last {logs.length} requests
          </div>
        </div>

        {logs.length > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      {/* Column headers */}
      {logs.length > 0 && (
        <div className="flex items-center gap-2.5 px-1 pb-2 border-b border-white/[0.06] mb-1">
          <div className="w-1.5 shrink-0" />
          <div className="flex-1 text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold">
            Model / Key
          </div>
          <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[32px]">
            Cache
          </div>
          <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[44px] text-right">
            Latency
          </div>
          <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[48px] text-right">
            Cost
          </div>
          <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[48px] text-right">
            When
          </div>
        </div>
      )}

      {/* Log list */}
      <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          logs.map((log) => (
            <LogRow
              key={log.id}
              log={log}
              isExpanded={expandedId === log.id}
              onToggle={() => toggle(log.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
