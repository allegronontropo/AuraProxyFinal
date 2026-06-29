"use client";

import { useState } from "react";

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

function statusColor(code: number | null): string {
  if (!code) return "#6b7280";
  if (code < 300) return "#34d399";
  if (code < 500) return "#f59e0b";
  return "#ef4444";
}

function latencyColor(ms: number | null): string {
  if (!ms) return "#6b7280";
  if (ms < 200) return "#34d399";
  if (ms < 500) return "#f59e0b";
  return "#ef4444";
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 32, opacity: 0.12 }}>▤</span>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>No requests yet</div>
      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5, maxWidth: 260 }}>
        Start using your proxy endpoint and requests will appear here in real-time.
      </div>
      <code
        style={{
          fontSize: 10,
          color: "#6b7280",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 5,
          padding: "4px 10px",
          marginTop: 4,
          fontFamily: "monospace",
        }}
      >
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
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "background 0.13s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 4px",
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: statusColor(log.statusCode),
            flexShrink: 0,
            boxShadow: `0 0 4px ${statusColor(log.statusCode)}88`,
          }}
        />

        {/* Model + Provider */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#f9fafb",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {truncateModel(log.model)}
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>
            {formatProvider(log.provider)}
            {log.apiKey && (
              <span style={{ color: "#374151" }}> · {log.apiKey.name}</span>
            )}
          </div>
        </div>

        {/* Cached badge */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: log.cached ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
            border: log.cached
              ? "1px solid rgba(52,211,153,0.25)"
              : "1px solid rgba(255,255,255,0.07)",
            color: log.cached ? "#34d399" : "#4b5563",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          {log.cached ? "HIT" : "MISS"}
        </span>

        {/* Latency */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: latencyColor(log.latencyMs),
            minWidth: 44,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {log.latencyMs != null ? `${log.latencyMs}ms` : "—"}
        </div>

        {/* Cost */}
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
            minWidth: 48,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {log.costUsd != null ? `$${Number(log.costUsd).toFixed(5)}` : "—"}
        </div>

        {/* Time ago */}
        <div
          style={{
            fontSize: 10,
            color: "#4b5563",
            minWidth: 48,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {timeAgo(log.createdAt)}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div
          style={{
            padding: "8px 16px 12px",
            background: "rgba(124,58,237,0.04)",
            borderTop: "1px solid rgba(124,58,237,0.12)",
          }}
        >
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Request ID", value: log.id.slice(0, 12) + "…" },
              { label: "Status Code", value: String(log.statusCode ?? "—") },
              { label: "Provider", value: formatProvider(log.provider) },
              { label: "Model", value: log.model },
              { label: "Latency", value: log.latencyMs ? `${log.latencyMs}ms` : "—" },
              { label: "Cost", value: log.costUsd ? `$${Number(log.costUsd).toFixed(6)}` : "—" },
              { label: "Cached", value: log.cached ? "Yes" : "No" },
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
                <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 2, fontFamily: "monospace" }}>
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
    <div
      style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 11,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>Recent Activity</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            Last {logs.length} requests
          </div>
        </div>

        {logs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#34d399",
                animation: "pulse 1.8s infinite",
              }}
            />
            <span style={{ fontSize: 10, color: "#34d399", fontWeight: 500 }}>Live</span>
          </div>
        )}
      </div>

      {/* Column headers */}
      {logs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 4px 8px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 4,
          }}
        >
          <div style={{ width: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Model / Key
          </div>
          <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 32 }}>
            Cache
          </div>
          <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 44, textAlign: "right" }}>
            Latency
          </div>
          <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 48, textAlign: "right" }}>
            Cost
          </div>
          <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 48, textAlign: "right" }}>
            When
          </div>
        </div>
      )}

      {/* Log list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          maxHeight: 320,
        }}
      >
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
