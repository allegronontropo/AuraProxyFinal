"use client";

import { useState, useCallback, useTransition } from "react";
import { fetchLogs } from "@/actions/logs";
import type { LogFilter } from "@/lib/queries";
import CustomSelect from "@/components/ui/CustomSelect";
import { ProviderIcon } from "@lobehub/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  name: string;
  keyPrefix: string;
}

interface LogRow {
  id: string;
  apiKeyId: string | null;
  projectId: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  statusCode: number;
  cached: boolean;
  error: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  createdAt: Date | string;
  apiKey?: ApiKey | null;
}

export interface LogsTableProps {
  projectId: string;
  initialLogs: LogRow[];
  initialTotal: number;
  initialPages: number;
  apiKeys?: { id: string; name: string; keyPrefix: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#cc785c",
  mistral: "#ff7000",
  google: "#4285F4",
  azure: "#0078D4",
  cohere: "#d64000",
  groq: "#f55036",
};

const PAGE_SIZES = [25, 50, 100];

// ─── Mock fallback data (shown when DB is empty) ───────────────────────────────

const MOCK_LOGS: LogRow[] = [
  {
    id: "log_01j9xz3k2m8p4qr5st6uvwxy0",
    apiKeyId: "key_01",
    projectId: "proj_01",
    provider: "openai",
    model: "gpt-4o",
    tokensIn: 1024,
    tokensOut: 512,
    costUsd: 0.0089,
    latencyMs: 843,
    statusCode: 200,
    cached: false,
    error: null,
    metadata: { region: "us-east-1" },
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
    apiKey: { name: "Production Key", keyPrefix: "sk-prod" },
  },
  {
    id: "log_01j9xz4n5p7qr8st9uvwxy1ab",
    apiKeyId: "key_01",
    projectId: "proj_01",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    tokensIn: 2048,
    tokensOut: 768,
    costUsd: 0.0241,
    latencyMs: 1203,
    statusCode: 200,
    cached: true,
    error: null,
    metadata: null,
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    apiKey: { name: "Production Key", keyPrefix: "sk-prod" },
  },
  {
    id: "log_01j9xz5p6q8rs9tu0vwxyz2bc",
    apiKeyId: "key_02",
    projectId: "proj_01",
    provider: "openai",
    model: "gpt-3.5-turbo",
    tokensIn: 512,
    tokensOut: 256,
    costUsd: 0.0004,
    latencyMs: 187,
    statusCode: 200,
    cached: true,
    error: null,
    metadata: null,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    apiKey: { name: "Staging Key", keyPrefix: "sk-stag" },
  },
  {
    id: "log_01j9xz6q7r9st0uv1wxyza3cd",
    apiKeyId: "key_02",
    projectId: "proj_01",
    provider: "mistral",
    model: "mistral-large-latest",
    tokensIn: 3072,
    tokensOut: 1024,
    costUsd: 0.0128,
    latencyMs: 2341,
    statusCode: 429,
    cached: false,
    error: "Rate limit exceeded. Retry after 60 seconds.",
    metadata: { retryAfter: 60 },
    createdAt: new Date(Date.now() - 28 * 60 * 1000),
    apiKey: { name: "Staging Key", keyPrefix: "sk-stag" },
  },
  {
    id: "log_01j9xz7r8s0tu1vw2xyzab4de",
    apiKeyId: "key_01",
    projectId: "proj_01",
    provider: "google",
    model: "gemini-1.5-pro",
    tokensIn: 4096,
    tokensOut: 2048,
    costUsd: 0.0196,
    latencyMs: 1876,
    statusCode: 200,
    cached: false,
    error: null,
    metadata: { safetyRatings: [] },
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    apiKey: { name: "Production Key", keyPrefix: "sk-prod" },
  },
  {
    id: "log_01j9xz8s9t1uv2wx3yzabc5ef",
    apiKeyId: "key_03",
    projectId: "proj_01",
    provider: "openai",
    model: "gpt-4o-mini",
    tokensIn: 768,
    tokensOut: 384,
    costUsd: 0.00023,
    latencyMs: 412,
    statusCode: 200,
    cached: false,
    error: null,
    metadata: null,
    createdAt: new Date(Date.now() - 1.2 * 60 * 60 * 1000),
    apiKey: { name: "Dev Key", keyPrefix: "sk-dev" },
  },
  {
    id: "log_01j9xz9t0u2vw3xy4zaabcd6fg",
    apiKeyId: "key_01",
    projectId: "proj_01",
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    tokensIn: 256,
    tokensOut: 128,
    costUsd: 0.000115,
    latencyMs: 298,
    statusCode: 200,
    cached: true,
    error: null,
    metadata: null,
    createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    apiKey: { name: "Production Key", keyPrefix: "sk-prod" },
  },
  {
    id: "log_01j9xzau1v3wx4yz5aabcde7gh",
    apiKeyId: "key_02",
    projectId: "proj_01",
    provider: "openai",
    model: "gpt-4-turbo",
    tokensIn: 8192,
    tokensOut: 4096,
    costUsd: 0.24,
    latencyMs: 5432,
    statusCode: 500,
    cached: false,
    error: "Internal server error from upstream provider.",
    metadata: null,
    createdAt: new Date(Date.now() - 3.8 * 60 * 60 * 1000),
    apiKey: { name: "Staging Key", keyPrefix: "sk-stag" },
  },
  {
    id: "log_01j9xzbv2w4xy5za6abcdef8hi",
    apiKeyId: "key_01",
    projectId: "proj_01",
    provider: "mistral",
    model: "mistral-medium",
    tokensIn: 1536,
    tokensOut: 512,
    costUsd: 0.006,
    latencyMs: 923,
    statusCode: 200,
    cached: false,
    error: null,
    metadata: null,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    apiKey: { name: "Production Key", keyPrefix: "sk-prod" },
  },
  {
    id: "log_01j9xzcw3x5yz6ab7bcdefg9ij",
    apiKeyId: "key_03",
    projectId: "proj_01",
    provider: "google",
    model: "gemini-1.5-flash",
    tokensIn: 512,
    tokensOut: 256,
    costUsd: 0.000128,
    latencyMs: 134,
    statusCode: 200,
    cached: true,
    error: null,
    metadata: null,
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    apiKey: { name: "Dev Key", keyPrefix: "sk-dev" },
  },
];

// ─── Utility helpers ──────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | string, now: number): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now - d.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.0001) return `$${usd.toFixed(8)}`;
  if (usd < 0.01) return `$${usd.toFixed(5)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function latencyColor(ms: number): string {
  if (ms < 200) return "#34d399";
  if (ms < 1000) return "#f59e0b";
  return "#ef4444";
}

function statusColor(code: number): string {
  if (code >= 500) return "#ef4444";
  if (code >= 400) return "#f59e0b";
  return "#34d399";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Filter pill button ────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "5px 12px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: active
          ? "1px solid rgba(124,58,237,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "rgba(124,58,237,0.18)"
          : hover
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)",
        color: active ? "#a78bfa" : "#9ca3af",
        cursor: "pointer",
        transition: "all 0.13s",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Inspector Panel ──────────────────────────────────────────────────────────

function Inspector({
  log,
  onClose,
}: {
  log: LogRow | null;
  onClose: () => void;
}) {
  if (!log) return null;

  const createdAt =
    typeof log.createdAt === "string"
      ? new Date(log.createdAt)
      : log.createdAt;

  return (
    <div
      style={{
        width: 300,
        background: "#0d0d0f",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#6b7280",
            fontWeight: 600,
          }}
        >
          Log Detail
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#4b5563",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            padding: "2px 4px",
            borderRadius: 4,
            transition: "color 0.13s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#9ca3af")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5563")}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px", flex: 1 }}>
        {/* Request ID */}
        <InspectorRow label="Request ID">
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: "#a78bfa",
              wordBreak: "break-all",
              userSelect: "text",
              cursor: "text",
            }}
          >
            {log.id}
          </span>
        </InspectorRow>

        {/* Timestamp */}
        <InspectorRow label="Timestamp">
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#d1d5db" }}>
            {createdAt.toISOString()}
          </span>
        </InspectorRow>

        {/* Provider */}
        <InspectorRow label="Provider">
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              background: `${PROVIDER_COLORS[log.provider] ?? "#6b7280"}20`,
              color: PROVIDER_COLORS[log.provider] ?? "#9ca3af",
              border: `1px solid ${PROVIDER_COLORS[log.provider] ?? "#6b7280"}44`,
            }}
          >
            {log.provider}
          </span>
        </InspectorRow>

        {/* Model */}
        <InspectorRow label="Model">
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#a78bfa" }}>
            {log.model}
          </span>
        </InspectorRow>

        {/* Status Code */}
        <InspectorRow label="Status Code">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: statusColor(log.statusCode),
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: statusColor(log.statusCode),
                display: "inline-block",
              }}
            />
            {log.statusCode}
          </span>
        </InspectorRow>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.05)",
            margin: "12px 0",
          }}
        />

        {/* Tokens */}
        <InspectorRow label="Tokens In">
          <span style={{ fontSize: 12, color: "#d1d5db" }}>
            {log.tokensIn.toLocaleString()}
          </span>
        </InspectorRow>
        <InspectorRow label="Tokens Out">
          <span style={{ fontSize: 12, color: "#d1d5db" }}>
            {log.tokensOut.toLocaleString()}
          </span>
        </InspectorRow>
        <InspectorRow label="Total Tokens">
          <span style={{ fontSize: 12, fontWeight: 600, color: "#f9fafb" }}>
            {(log.tokensIn + log.tokensOut).toLocaleString()}
          </span>
        </InspectorRow>

        {/* Cost */}
        <InspectorRow label="Cost USD">
          <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>
            {formatCost(log.costUsd)}
          </span>
        </InspectorRow>

        {/* Latency */}
        <InspectorRow label="Latency">
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: latencyColor(log.latencyMs),
            }}
          >
            {log.latencyMs.toLocaleString()} ms
          </span>
        </InspectorRow>

        {/* Saved to Cache */}
        <InspectorRow label="Saved to Cache">
          {!log.cached ? (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                background: "rgba(52,211,153,0.15)",
                color: "#34d399",
                border: "1px solid rgba(52,211,153,0.25)",
              }}
            >
              YES
            </span>
          ) : (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: "rgba(255,255,255,0.04)",
                color: "#6b7280",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              NO (Served from cache)
            </span>
          )}
        </InspectorRow>

        {/* API Key */}
        {log.apiKey && (
          <InspectorRow label="API Key">
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              {log.apiKey.name}{" "}
              <span style={{ fontFamily: "monospace", color: "#6b7280", fontSize: 10 }}>
                ({log.apiKey.keyPrefix}…)
              </span>
            </span>
          </InspectorRow>
        )}

        {/* Error */}
        {log.error && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6b7280",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Error
            </div>
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 7,
                padding: "10px 12px",
                fontSize: 11,
                color: "#f87171",
                lineHeight: 1.5,
                fontFamily: "monospace",
                wordBreak: "break-word",
              }}
            >
              {log.error}
            </div>
          </div>
        )}

        {/* Metadata */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6b7280",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Metadata
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 7,
                padding: "10px 12px",
                fontSize: 10,
                color: "#9ca3af",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                lineHeight: 1.6,
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {JSON.stringify(log.metadata, null, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inspector row helper ─────────────────────────────────────────────────────

function InspectorRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#6b7280",
          flexShrink: 0,
          paddingTop: 1,
          minWidth: 80,
        }}
      >
        {label}
      </span>
      <div style={{ textAlign: "right", minWidth: 0, flex: 1 }}>{children}</div>
    </div>
  );
}

// ─── Pagination button ────────────────────────────────────────────────────────

function PagBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "5px 12px",
        borderRadius: 6,
        fontSize: 12,
        border: active
          ? "1px solid rgba(124,58,237,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "rgba(124,58,237,0.18)"
          : hover && !disabled
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)",
        color: disabled ? "#374151" : active ? "#a78bfa" : "#9ca3af",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.13s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LogsTable({
  projectId,
  initialLogs,
  initialTotal,
  initialPages,
  apiKeys = [],
}: LogsTableProps) {
  const useMock = initialLogs.length === 0;
  const [logs, setLogs] = useState<LogRow[]>(useMock ? MOCK_LOGS : initialLogs);
  const [total, setTotal] = useState(useMock ? MOCK_LOGS.length : initialTotal);
  const [pages, setPages] = useState(useMock ? 1 : initialPages);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [now] = useState(() => Date.now());

  const [filters, setFilters] = useState<{
    provider: string;
    statusGroup: string; // "all" | "2xx" | "4xx" | "5xx"
    cached: string; // "all" | "hit" | "miss"
    model: string;
    apiKeyId: string;
  }>({ provider: "all", statusGroup: "all", cached: "all", model: "", apiKeyId: "" });

  const [sortBy, setSortBy] = useState<"createdAt" | "latencyMs" | "costUsd">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);
  const [isPending, startTransition] = useTransition();

  // Build LogFilter from local filter state
  const buildLogFilter = useCallback(
    (f: typeof filters): LogFilter => {
      const lf: LogFilter = {};
      if (f.provider !== "all") lf.provider = f.provider;
      if (f.cached === "hit") lf.cached = true;
      if (f.cached === "miss") lf.cached = false;
      if (f.model) lf.model = f.model;
      if (f.apiKeyId) lf.apiKeyId = f.apiKeyId;
      // statusCode handled client-side for group filtering
      return lf;
    },
    []
  );

  const load = useCallback(
    (
      newPage: number,
      newPageSize: number,
      newFilters: typeof filters,
      newSortBy: "createdAt" | "latencyMs" | "costUsd",
      newSortOrder: "asc" | "desc"
    ) => {
      if (useMock) return; // don't fetch for mock data
      startTransition(async () => {
        const lf = buildLogFilter(newFilters);
        const result = await fetchLogs(
          projectId,
          newPage,
          newPageSize,
          lf,
          newSortBy,
          newSortOrder
        );
        setLogs(result.logs as LogRow[]);
        setTotal(result.total);
        setPages(result.pages);
      });
    },
    [projectId, buildLogFilter, useMock]
  );

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string
  ) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setPage(1);
    load(1, pageSize, next, sortBy, sortOrder);
  };

  const handlePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
    load(1, size, filters, sortBy, sortOrder);
  };

  const handlePage = (p: number) => {
    setPage(p);
    load(p, pageSize, filters, sortBy, sortOrder);
  };

  const handleSort = (col: "createdAt" | "latencyMs" | "costUsd") => {
    const newOrder =
      sortBy === col && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(col);
    setSortOrder(newOrder);
    load(page, pageSize, filters, col, newOrder);
  };

  // Client-side filtering (especially important for mock data)
  const visibleLogs = logs.filter((l) => {
    if (filters.statusGroup === "2xx" && (l.statusCode < 200 || l.statusCode >= 300)) return false;
    if (filters.statusGroup === "4xx" && (l.statusCode < 400 || l.statusCode >= 500)) return false;
    if (filters.statusGroup === "5xx" && l.statusCode < 500) return false;
    
    if (filters.provider !== "all" && l.provider !== filters.provider) return false;
    if (filters.cached === "hit" && !l.cached) return false;
    if (filters.cached === "miss" && l.cached) return false;
    
    if (filters.model && !l.model.toLowerCase().includes(filters.model.toLowerCase())) return false;
    if (filters.apiKeyId && l.apiKeyId !== filters.apiKeyId) return false;
    
    return true;
  });

  const sortArrow = (col: "createdAt" | "latencyMs" | "costUsd") => {
    if (sortBy !== col) return null;
    return sortOrder === "desc" ? " ↓" : " ↑";
  };

  const renderSortableTh = (
    col: "createdAt" | "latencyMs" | "costUsd",
    label: string
  ) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: "8px 12px",
        textAlign: "left",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: sortBy === col ? "#a78bfa" : "#6b7280",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {sortArrow(col)}
    </th>
  );

  return (
    <div className="flex-1 flex bg-white/[0.015] border border-white/[0.08] rounded-[11px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] p-5">
      {/* ── Table area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filters Top Row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Filter by model (e.g. gpt-4)"
            value={filters.model}
            onChange={(e) => handleFilterChange("model", e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 13,
              flex: 1,
              maxWidth: 240,
              outline: "none",
            }}
          />
          <CustomSelect
            value={filters.apiKeyId}
            onChange={(val) => handleFilterChange("apiKeyId", val)}
            placeholder="All API Keys"
            options={[
              { value: "", label: "All API Keys" },
              ...apiKeys.map(k => ({ value: k.id, label: `${k.name} (${k.keyPrefix}...)` }))
            ]}
            className="flex-1 max-w-[240px]"
          />
        </div>

        {/* Filter pills row */}
        <div
          style={{
            padding: "0 0 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {/* Provider */}
          <div style={{ display: "flex", gap: 4 }}>
            {["all", "openai", "anthropic", "mistral", "google", "groq"].map((p) => (
              <FilterPill
                key={p}
                label={p === "all" ? "All Providers" : p.charAt(0).toUpperCase() + p.slice(1)}
                icon={p !== "all" ? <ProviderIcon provider={p} size={14} type="color" /> : undefined}
                active={filters.provider === p}
                onClick={() => handleFilterChange("provider", p)}
              />
            ))}
          </div>

          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.07)",
            }}
          />

          {/* Status */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { val: "all", label: "All Status" },
              { val: "2xx", label: "2xx" },
              { val: "4xx", label: "4xx" },
              { val: "5xx", label: "5xx" },
            ].map((s) => (
              <FilterPill
                key={s.val}
                label={s.label}
                active={filters.statusGroup === s.val}
                onClick={() => handleFilterChange("statusGroup", s.val)}
              />
            ))}
          </div>

          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.07)",
            }}
          />

          {/* Cache */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { val: "all", label: "All Cache" },
              { val: "hit", label: "Hit" },
              { val: "miss", label: "Miss" },
            ].map((c) => (
              <FilterPill
                key={c.val}
                label={c.label}
                active={filters.cached === c.val}
                onClick={() => handleFilterChange("cached", c.val)}
              />
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Count */}
          <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
            {useMock ? (
              <span style={{ color: "#7c3aed", fontSize: 11 }}>
                ◎ Sample data
              </span>
            ) : (
              <>
                <span style={{ color: "#9ca3af" }}>{visibleLogs.length}</span>
                {" "}of{" "}
                <span style={{ color: "#9ca3af" }}>{total.toLocaleString()}</span>
                {" "}requests
              </>
            )}
          </span>

          {/* Loading indicator */}
          {isPending && (
            <span style={{ fontSize: 11, color: "#6b7280" }}>Loading…</span>
          )}

          {/* Export */}
          <ExportButton logs={visibleLogs} />
        </div>

        {/* Table scroll area */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              minWidth: 900,
            }}
          >
            <colgroup>
              <col style={{ width: 90 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 60 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 110 }} />
            </colgroup>
            <thead>
              <tr
                style={{
                  background: "rgba(255,255,255,0.03)",
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                }}
              >
                {renderSortableTh("createdAt", "Time")}
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Model
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Provider
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Tokens
                </th>
                {renderSortableTh("costUsd", "Cost ($)")}
                {renderSortableTh("latencyMs", "Latency")}
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Cache
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#6b7280",
                  }}
                >
                  Key
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: "60px 0",
                      textAlign: "center",
                      color: "#4b5563",
                      fontSize: 13,
                    }}
                  >
                    No requests match the current filters.
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    log={log}
                    selected={selectedLog?.id === log.id}
                    now={now}
                    onClick={() =>
                      setSelectedLog(
                        selectedLog?.id === log.id ? null : log
                      )
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 0 0",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <PagBtn
            disabled={page <= 1 || useMock}
            onClick={() => handlePage(page - 1)}
          >
            ← Prev
          </PagBtn>

          <span
            style={{ fontSize: 12, color: "#6b7280", padding: "0 8px" }}
          >
            Page{" "}
            <span style={{ color: "#f9fafb", fontWeight: 600 }}>{page}</span>
            {" "}of{" "}
            <span style={{ color: "#f9fafb", fontWeight: 600 }}>
              {Math.max(1, pages)}
            </span>
          </span>

          <PagBtn
            disabled={page >= pages || useMock}
            onClick={() => handlePage(page + 1)}
          >
            Next →
          </PagBtn>

          <div
            style={{
              width: 1,
              height: 16,
              background: "rgba(255,255,255,0.07)",
              margin: "0 4px",
            }}
          />

          <span style={{ fontSize: 11, color: "#6b7280" }}>Rows:</span>
          <div style={{ display: "flex", gap: 4 }}>
            {PAGE_SIZES.map((s) => (
              <PagBtn
                key={s}
                active={pageSize === s}
                onClick={() => handlePageSize(s)}
              >
                {s}
              </PagBtn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Inspector panel ── */}
      <Inspector log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

// ─── Table row (memoized via stable ref) ──────────────────────────────────────

function TableRow({
  log,
  selected,
  now,
  onClick,
}: {
  log: LogRow;
  selected: boolean;
  now?: number;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const providerColor = PROVIDER_COLORS[log.provider] ?? "#6b7280";
  const [currentNow] = useState(() => now ?? Date.now());

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        background: selected
          ? "rgba(124,58,237,0.07)"
          : hover
          ? "rgba(255,255,255,0.02)"
          : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Time */}
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
          {formatRelativeTime(log.createdAt, currentNow)}
        </span>
      </td>

      {/* Model */}
      <td style={{ padding: "10px 12px" }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "#a78bfa",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={log.model}
        >
          {truncate(log.model, 22)}
        </span>
      </td>

      {/* Provider */}
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              background: `${providerColor}18`,
              color: providerColor,
              border: `1px solid ${providerColor}35`,
              whiteSpace: "nowrap",
            }}
          >
            <ProviderIcon provider={log.provider} size={12} type="color" />
            {log.provider}
          </span>
          {log.metadata?.fallback_provider && (
            <span
              style={{
                display: "inline-block",
                padding: "2px 4px",
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 700,
                background: "rgba(245,158,11,0.15)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.25)",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
              title={`Fell back from ${log.metadata.primary_provider}`}
            >
              FALLBACK
            </span>
          )}
        </div>
      </td>

      {/* Tokens */}
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
          {log.tokensIn.toLocaleString()}{" "}
          <span style={{ color: "#4b5563" }}>/</span>{" "}
          {log.tokensOut.toLocaleString()}
        </span>
      </td>

      {/* Cost */}
      <td style={{ padding: "10px 12px" }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#34d399",
            whiteSpace: "nowrap",
          }}
        >
          {formatCost(log.costUsd)}
        </span>
      </td>

      {/* Latency */}
      <td style={{ padding: "10px 12px" }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: latencyColor(log.latencyMs),
            whiteSpace: "nowrap",
          }}
        >
          {log.latencyMs >= 1000
            ? `${(log.latencyMs / 1000).toFixed(1)}s`
            : `${log.latencyMs}ms`}
        </span>
      </td>

      {/* Cache */}
      <td style={{ padding: "10px 12px" }}>
        {log.cached ? (
          <span
            style={{
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 700,
              background: "rgba(52,211,153,0.15)",
              color: "#34d399",
              border: "1px solid rgba(52,211,153,0.25)",
              letterSpacing: "0.04em",
            }}
          >
            HIT
          </span>
        ) : (
          <span
            style={{
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 600,
              background: "rgba(255,255,255,0.04)",
              color: "#4b5563",
              border: "1px solid rgba(255,255,255,0.07)",
              letterSpacing: "0.04em",
            }}
          >
            MISS
          </span>
        )}
      </td>

      {/* Status */}
      <td style={{ padding: "10px 12px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            color: statusColor(log.statusCode),
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: statusColor(log.statusCode),
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {log.statusCode}
        </span>
      </td>

      {/* Key */}
      <td style={{ padding: "10px 12px" }}>
        <span
          style={{
            fontSize: 10,
            color: "#4b5563",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
          title={
            log.apiKey
              ? `${log.apiKey.name} (${log.apiKey.keyPrefix}…)`
              : log.apiKeyId ?? ""
          }
        >
          {log.apiKey?.keyPrefix
            ? `${log.apiKey.keyPrefix}…`
            : log.apiKeyId
            ? log.apiKeyId.slice(0, 8)
            : "—"}
        </span>
      </td>
    </tr>
  );
}

// ─── Export button ─────────────────────────────────────────────────────────────

function ExportButton({ logs }: { logs: LogRow[] }) {
  const [hover, setHover] = useState(false);

  const handleExport = () => {
    const headers = [
      "id",
      "createdAt",
      "provider",
      "model",
      "tokensIn",
      "tokensOut",
      "costUsd",
      "latencyMs",
      "statusCode",
      "cached",
      "error",
    ];
    const rows = logs.map((l) =>
      [
        l.id,
        typeof l.createdAt === "string"
          ? l.createdAt
          : l.createdAt.toISOString(),
        l.provider,
        l.model,
        l.tokensIn,
        l.tokensOut,
        l.costUsd,
        l.latencyMs,
        l.statusCode,
        l.cached,
        l.error ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "5px 12px",
        borderRadius: 6,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: hover ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        color: "#9ca3af",
        cursor: "pointer",
        transition: "all 0.13s",
        display: "flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 11 }}>↓</span> Export CSV
    </button>
  );
}
