"use client";

import React, { useMemo, useState } from "react";
import { ProviderIcon } from "@lobehub/icons";

type RecentEvent = {
  id: string;
  createdAt: string;
  provider: string;
  model: string;
  latencyMs: number;
  statusCode: number;
  cached: boolean;
  cacheHitType: string;
  similarityScore: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const now = Date.now();
  const ts = new Date(date).getTime();
  const diff = Math.floor((now - ts) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getCachePillClasses(hitType: string) {
  if (hitType === "semantic") return "bg-violet-500/10 text-violet-400 border-violet-500/20";
  if (hitType === "exact") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return "bg-white/[0.04] text-gray-400 border-white/[0.08]";
}

function formatSimilarity(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(2);
}

function truncateModel(model: string): string {
  if (model.length <= 28) return model;
  return model.slice(0, 26) + "…";
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-6 text-center">
      <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-600" />
      </div>
      <div className="text-[13px] font-medium text-gray-400">No cache events yet</div>
      <div className="text-xs text-gray-500 leading-relaxed max-w-[260px]">
        Cache events will appear here once your proxy starts serving cached responses.
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecentCacheActivityClient({ events }: { events: RecentEvent[] }) {
  const LIMIT = 12;
  const PAGE_SIZE = 6;
  const data = useMemo(() => events.slice(0, LIMIT), [events]);
  const pageCount = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const [page, setPage] = useState(1);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = data.slice(start, start + PAGE_SIZE);

  const exactCount = data.filter((e) => e.cached && e.cacheHitType === "exact").length;
  const semanticCount = data.filter((e) => e.cached && e.cacheHitType === "semantic").length;

  return (
    <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] px-5 py-4 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[13px] font-semibold text-gray-100">Recent Cache Activity</div>
          <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">
            Last {Math.min(data.length, LIMIT)} events · paginated
          </div>
        </div>

        {/* Cache type summary pills */}
        {data.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Exact {exactCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span>Semantic {semanticCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {data.length > 0 ? (
        <>
          {/* Column headers */}
          <div className="flex items-center gap-2.5 px-1 pb-2 border-b border-white/[0.06] mb-1">
            <div className="flex-1 text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold">
              Model / Provider
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[56px]">
              Outcome
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[52px] text-right">
              Sim
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[52px] text-right">
              Latency
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.06em] font-semibold min-w-[48px] text-right">
              When
            </div>
          </div>

          {/* Rows */}
          <div className="flex-1">
            {pageItems.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-2.5 px-1 py-2.5 border-b border-white/[0.04] transition-colors duration-150 hover:bg-white/[0.02]"
              >
                {/* Model + Provider */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
                    {truncateModel(event.model)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <ProviderIcon provider={event.provider} size={12} type="color" />
                    {event.provider.charAt(0).toUpperCase() + event.provider.slice(1)}
                  </div>
                </div>

                {/* Outcome badge */}
                <div className="min-w-[56px] shrink-0">
                  <span
                    className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getCachePillClasses(event.cached ? event.cacheHitType : "miss")}`}
                  >
                    {event.cached ? event.cacheHitType : "miss"}
                  </span>
                </div>

                {/* Similarity */}
                <div className="text-[11px] text-gray-300 min-w-[52px] text-right shrink-0">
                  {event.cached && event.cacheHitType === "semantic"
                    ? formatSimilarity(event.similarityScore)
                    : "—"}
                </div>

                {/* Latency */}
                <div className={`text-[11px] font-medium min-w-[52px] text-right shrink-0 ${
                  event.latencyMs < 200 ? "text-emerald-400" : event.latencyMs < 500 ? "text-amber-400" : "text-red-500"
                }`}>
                  {event.latencyMs}ms
                </div>

                {/* Time ago */}
                <div suppressHydrationWarning className="text-[10px] text-gray-500 min-w-[48px] text-right shrink-0">
                  {timeAgo(event.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/[0.05]">
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.06em] font-semibold">
                {start + 1}–{Math.min(start + PAGE_SIZE, data.length)} of {data.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2.5 py-1 rounded-[4px] bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-400 font-medium transition-colors hover:bg-white/[0.06] hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <div className="text-[10px] text-gray-500 font-medium">{page}/{pageCount}</div>
                <button
                  className="px-2.5 py-1 rounded-[4px] bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-400 font-medium transition-colors hover:bg-white/[0.06] hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
