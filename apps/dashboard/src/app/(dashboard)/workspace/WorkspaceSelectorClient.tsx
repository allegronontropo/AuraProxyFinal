"use client";

import Image from "next/image";
import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createProject, deleteProject } from "@/actions/project";
import { signOut } from "next-auth/react";
/** Lightweight relative-time formatter - no external dep needed. */
function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type BudgetPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

interface RawProject {
  id: string;
  name: string;
  isActive: boolean;
  budgetLimit: number;
  budgetPeriod: BudgetPeriod;
  createdAt: Date;
  updatedAt?: Date | null;
  _count?: { apiKeys: number; logs: number };
}

interface Workspace {
  id: string;
  name: string;
  env: "PROD" | "STG" | "DEV";
  desc: string;
  role: "Admin";
  status: "Optimal" | "Degraded";
  updated: string;
  budgetLimit: number;
  budgetPeriod: BudgetPeriod;
  keyCount: number;
  logCount: number;
}

interface UserInfo {
  name: string;
  email: string;
  initials: string;
}

type View = "select" | "create" | "reveal";

interface CreatedResult {
  projectId: string;
  name: string;
  env: "PROD" | "STG" | "DEV";
  apiKey: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toEnv(period: BudgetPeriod, isActive: boolean): "PROD" | "STG" | "DEV" {
  if (!isActive) return "DEV";
  if (period === "MONTHLY") return "PROD";
  if (period === "WEEKLY") return "STG";
  return "DEV";
}

function mapProject(p: RawProject): Workspace {
  const env = toEnv(p.budgetPeriod, p.isActive);
  return {
    id: p.id,
    name: p.name,
    env,
    desc: "AI routing workspace",
    role: "Admin",
    status: "Optimal",
    updated: formatRelative(new Date(p.createdAt)),
    budgetLimit: p.budgetLimit,
    budgetPeriod: p.budgetPeriod,
    keyCount: p._count?.apiKeys ?? 0,
    logCount: p._count?.logs ?? 0,
  };
}

const ENV_PERIOD_MAP: Record<"PROD" | "STG" | "DEV", BudgetPeriod> = {
  PROD: "MONTHLY",
  STG: "WEEKLY",
  DEV: "DAILY",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EnvBadge({ env }: { env: "PROD" | "STG" | "DEV" }) {
  const styles: Record<string, React.CSSProperties> = {
    PROD: {
      background: "rgba(124,58,237,0.2)",
      color: "#c4b5fd",
      border: "1px solid rgba(124,58,237,0.4)",
    },
    STG: {
      background: "rgba(255,255,255,0.06)",
      color: "#9ca3af",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    DEV: {
      background: "rgba(6,182,212,0.12)",
      color: "#67e8f9",
      border: "1px solid rgba(6,182,212,0.3)",
    },
  };
  return (
    <span
      style={{
        ...styles[env],
        fontSize: 10,
        fontFamily: "monospace",
        padding: "2px 6px",
        borderRadius: 4,
        fontWeight: 600,
        letterSpacing: "0.05em",
      }}
    >
      {env}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      style={{
        background: "rgba(124,58,237,0.15)",
        color: "#a78bfa",
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "Optimal" ? "#06b6d4" : status === "Degraded" ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 12, color }}>{status}</span>
    </span>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  wsName,
  onConfirm,
  onCancel,
  isPending,
}: {
  wsName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111113",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 14,
          padding: 24,
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(239,68,68,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16 }}>🗑</span>
          </div>
          <div>
            <div style={{ color: "#f9fafb", fontWeight: 600, fontSize: 15 }}>Delete workspace?</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>This action cannot be undone.</div>
          </div>
        </div>
        <div
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 18,
            color: "#9ca3af",
            fontSize: 13,
          }}
        >
          You are about to permanently delete{" "}
          <span style={{ color: "#f9fafb", fontWeight: 500 }}>«{wsName}»</span>.
          All API keys and logs will be lost.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#9ca3af",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 8,
              background: isPending ? "rgba(239,68,68,0.3)" : "#dc2626",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Row ────────────────────────────────────────────────────────────

function WorkspaceRow({
  ws,
  selected,
  onClick,
  onDelete,
}: {
  ws: Workspace;
  selected: string | null;
  onClick: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const isSelected = selected === ws.id;
  return (
    <div
      onClick={() => onClick(ws.id)}
      style={{
        border: isSelected
          ? "1px solid rgba(124,58,237,0.6)"
          : "1px solid rgba(255,255,255,0.07)",
        background: isSelected ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)",
        borderRadius: 10,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.15s",
        marginBottom: 8,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(124,58,237,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 14, color: "#a78bfa" }}>◈</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#f9fafb", fontSize: 14, fontWeight: 500 }}>
                {ws.name}
              </span>
              <EnvBadge env={ws.env} />
            </div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{ws.desc}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RoleBadge role={ws.role} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ws.id, ws.name);
            }}
            title="Delete workspace"
            style={{
              background: "none",
              border: "1px solid rgba(239,68,68,0.0)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#4b5563",
              fontSize: 14,
              transition: "all 0.15s",
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#4b5563";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.0)";
            }}
          >
            🗑
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div>
          <div
            style={{
              color: "#4b5563",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Budget
          </div>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>${ws.budgetLimit} / {ws.budgetPeriod.toLowerCase()}</span>
        </div>
        <div>
          <div
            style={{
              color: "#4b5563",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            API Keys
          </div>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{ws.keyCount} active</span>
        </div>
        <div>
          <div
            style={{
              color: "#4b5563",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Status
          </div>
          <StatusDot status={ws.status} />
        </div>
        <div>
          <div
            style={{
              color: "#4b5563",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Created
          </div>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{ws.updated}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Create Workspace View ────────────────────────────────────────────────────

function CreateWorkspaceView({
  onCreated,
  onBack,
}: {
  onCreated: (result: CreatedResult) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [env, setEnv] = useState<"PROD" | "STG" | "DEV">("PROD");
  const [budgetLimit, setBudgetLimit] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("budgetLimit", String(budgetLimit));
    formData.set("budgetPeriod", ENV_PERIOD_MAP[env]);

    startTransition(async () => {
      const result = await createProject(formData);
      if (!result) {
        setError("Unexpected error. Please try again.");
        return;
      }
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result.success && result.projectId && result.apiKey) {
        onCreated({
          projectId: result.projectId,
          name: name.trim(),
          env,
          apiKey: result.apiKey,
        });
      }
    });
  }, [name, env, budgetLimit, onCreated]);

  return (
    <div style={{ padding: "20px 24px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          cursor: "pointer",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 16,
          padding: 0,
        }}
      >
        ← Back
      </button>
      <div style={{ color: "#f9fafb", fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
        New workspace
      </div>
      <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        Configure your AI routing environment
      </div>

      {/* Name */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}
        >
          Workspace name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Production Core"
          autoFocus
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "9px 12px",
            color: "#f9fafb",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Budget Limit */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}
        >
          Budget limit (USD)
        </label>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            $
          </span>
          <input
            type="number"
            value={budgetLimit}
            min={1}
            max={100000}
            onChange={(e) => setBudgetLimit(Math.max(1, Number(e.target.value)))}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "9px 12px 9px 24px",
              color: "#f9fafb",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Environment / Budget Period toggle */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}
        >
          Budget period
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["PROD", "STG", "DEV"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEnv(e)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 7,
                fontSize: 12,
                fontFamily: "monospace",
                fontWeight: 600,
                cursor: "pointer",
                background: env === e ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                border:
                  env === e
                    ? "1px solid rgba(124,58,237,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                color: env === e ? "#c4b5fd" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              {e}
            </button>
          ))}
        </div>
        <div style={{ color: "#4b5563", fontSize: 11, marginTop: 6 }}>
          {env === "PROD" ? "Monthly budget reset" : env === "STG" ? "Weekly budget reset" : "Daily budget reset"}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 16,
            color: "#f87171",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={!name.trim() || isPending}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: name.trim() && !isPending ? "pointer" : "not-allowed",
          background: name.trim() && !isPending ? "#7c3aed" : "rgba(124,58,237,0.3)",
          border: "none",
          color: "#fff",
          transition: "all 0.15s",
        }}
      >
        {isPending ? "Creating workspace…" : "Create workspace →"}
      </button>
    </div>
  );
}

// ─── API Key Reveal View ──────────────────────────────────────────────────────

function ApiKeyRevealView({
  result,
  onContinue,
}: {
  result: CreatedResult;
  onContinue: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const lastFour = result.apiKey.slice(-4);
  const displayKey = revealed
    ? result.apiKey
    : result.apiKey.slice(0, 12) + "••••••••••••" + lastFour;

  const handleCopy = () => {
    navigator.clipboard?.writeText(result.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "rgba(16,185,129,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ color: "#10b981", fontSize: 20 }}>✓</span>
        </div>
        <div
          style={{ color: "#f9fafb", fontSize: 16, fontWeight: 500, marginBottom: 4 }}
        >
          Workspace created
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>{result.name}</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              padding: "1px 5px",
              borderRadius: 3,
              background: "rgba(124,58,237,0.2)",
              color: "#c4b5fd",
            }}
          >
            {result.env}
          </span>
        </div>
      </div>

      {/* Key box */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>
          Your Aura Proxy API key
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: 12,
              color: "#d1d5db",
              letterSpacing: "0.02em",
              wordBreak: "break-all",
            }}
          >
            {displayKey}
          </span>
          <button
            onClick={() => setRevealed(!revealed)}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 16,
              padding: "2px 4px",
              lineHeight: 1,
            }}
            title={revealed ? "Hide key" : "Reveal key"}
          >
            {revealed ? "◉" : "○"}
          </button>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
              border: copied
                ? "1px solid rgba(16,185,129,0.3)"
                : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              color: copied ? "#10b981" : "#9ca3af",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Warning */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginTop: 12,
            padding: "10px 12px",
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 8,
          }}
        >
          <span style={{ color: "#f59e0b", fontSize: 14, flexShrink: 0 }}>⚠</span>
          <span style={{ color: "#d97706", fontSize: 12 }}>
            This key will not be shown again. Copy it now and store it securely.
          </span>
        </div>
      </div>

      <button
        onClick={onContinue}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          background: "#7c3aed",
          border: "none",
          color: "#fff",
        }}
      >
        Continue to dashboard →
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "rgba(124,58,237,0.12)",
          border: "1px solid rgba(124,58,237,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color: "#a78bfa",
        }}
      >
        ◈
      </div>
      <div style={{ color: "#f9fafb", fontSize: 14, fontWeight: 500 }}>
        No workspaces yet
      </div>
      <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", maxWidth: 280 }}>
        Create your first workspace to start routing AI traffic through Aura Proxy.
      </div>
      <button
        onClick={onCreateClick}
        style={{
          marginTop: 8,
          padding: "9px 20px",
          background: "#7c3aed",
          border: "none",
          borderRadius: 8,
          color: "#fff",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        + Create workspace
      </button>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

const PAGE_SIZE = 2;

export function WorkspaceSelectorClient({
  projects: initialProjects,
  user,
}: {
  projects: RawProject[];
  user: UserInfo;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<RawProject[]>(initialProjects);
  const [selected, setSelected] = useState<string | null>(
    initialProjects.length > 0 ? initialProjects[0].id : null
  );
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("select");
  const [createdResult, setCreatedResult] = useState<CreatedResult | null>(null);
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const workspaces = projects.map(mapProject);

  const filtered = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.env.toLowerCase().includes(search.toLowerCase())
  );

  const listToShow = search ? filtered : workspaces;
  const totalPages = Math.ceil(listToShow.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageSlice = listToShow.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const handleCreated = useCallback((result: CreatedResult) => {
    setCreatedResult(result);
    setSelected(result.projectId);
    setView("reveal");
  }, []);

  const handleContinue = useCallback(() => {
    if (createdResult?.projectId) {
      router.push(`/dashboard/${createdResult.projectId}`);
    }
  }, [createdResult, router]);

  const handleSelectContinue = useCallback(() => {
    if (selected) {
      router.push(`/dashboard/${selected}`);
    }
  }, [selected, router]);

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      // deleteProject redirects to /workspace on success (no return value),
      // and returns { error } on failure. So absence of an error means success.
      const res = await deleteProject(deleteTarget.id);
      if (!res || !("error" in res)) {
        // Optimistically remove from local list (server redirect will also reload)
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        if (selected === deleteTarget.id) setSelected(null);
      }
      setDeleteTarget(null);
    });
  }, [deleteTarget, selected]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const DOT_GRID: React.CSSProperties = {
    backgroundImage:
      "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    backgroundColor: "#0A0A0B",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  return (
    <div style={DOT_GRID}>
      {/* Header logo + title */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "rgba(124,58,237,0.2)",
            border: "1px solid rgba(124,58,237,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            overflow: "hidden",
          }}
        >
          <Image
            src="/AURA_LOGO.png"
            alt="Aura Proxy"
            width={36}
            height={36}
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
        </div>
        {view === "select" && (
          <>
            <div
              style={{ color: "#f9fafb", fontSize: 22, fontWeight: 600, marginBottom: 6 }}
            >
              Select workspace
            </div>
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              Choose an environment to manage routing and AI traffic.
            </div>
          </>
        )}
        {view === "create" && (
          <div style={{ color: "#f9fafb", fontSize: 22, fontWeight: 600 }}>
            New workspace
          </div>
        )}
        {view === "reveal" && (
          <div style={{ color: "#f9fafb", fontSize: 22, fontWeight: 600 }}>
            Almost there
          </div>
        )}
      </div>

      {/* Main card */}
      <div
        style={{
          background: "rgba(17,17,19,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 500,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 200px)",
        }}
      >
        {/* ── SELECT VIEW ── */}
        {view === "select" && (
          <>
            <div style={{ padding: "20px 20px 0", flex: 1, overflowY: "auto", minHeight: 0 }}>
              {/* User header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(124,58,237,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: "#a78bfa",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {user.initials}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        color: "#f9fafb",
                        fontSize: 14,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 220,
                      }}
                    >
                      {user.name}
                    </div>
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 220,
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 7,
                    padding: "5px 12px",
                    color: "#9ca3af",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.13s",
                  }}
                >
                  Sign out
                </button>
              </div>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: 16 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#4b5563",
                    fontSize: 14,
                    pointerEvents: "none",
                  }}
                >
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workspaces…"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "9px 12px 9px 34px",
                    color: "#f9fafb",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Workspace list */}
              {workspaces.length === 0 ? (
                <EmptyState onCreateClick={() => setView("create")} />
              ) : listToShow.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                    color: "#4b5563",
                    fontSize: 13,
                  }}
                >
                  No workspaces match &ldquo;{search}&rdquo;
                </div>
              ) : (
                <div>
                  {/* Section label */}
                  <div
                    style={{
                      color: "#4b5563",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    {search ? "Results" : "All workspaces"}
                  </div>

                  {/* Workspace cards for current page */}
                  {pageSlice.map((ws) => (
                    <WorkspaceRow
                      key={ws.id}
                      ws={ws}
                      selected={selected}
                      onClick={setSelected}
                      onDelete={handleDeleteRequest}
                    />
                  ))}

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        marginTop: 6,
                        marginBottom: 4,
                      }}
                    >
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={safePage === 0}
                        title="Previous"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: safePage === 0 ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.1)",
                          color: safePage === 0 ? "#374151" : "#a78bfa",
                          fontSize: 14,
                          cursor: safePage === 0 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s",
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ‹
                      </button>

                      {/* Dot indicators */}
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            style={{
                              width: i === safePage ? 18 : 6,
                              height: 6,
                              borderRadius: 3,
                              border: "none",
                              background: i === safePage ? "#7c3aed" : "rgba(255,255,255,0.15)",
                              cursor: "pointer",
                              padding: 0,
                              transition: "all 0.2s",
                            }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={safePage >= totalPages - 1}
                        title="Next"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: safePage >= totalPages - 1 ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.1)",
                          color: safePage >= totalPages - 1 ? "#374151" : "#a78bfa",
                          fontSize: 14,
                          cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s",
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delete confirmation modal */}
            {deleteTarget && (
              <DeleteConfirmModal
                wsName={deleteTarget.name}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                isPending={isDeleting}
              />
            )}

            {/* Footer actions - only show continue button if there are workspaces */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: workspaces.length === 0 ? "flex-end" : "space-between",
                padding: "16px 20px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {workspaces.length > 0 && (
                <button
                  onClick={() => setView("create")}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "8px 14px",
                    color: "#9ca3af",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.13s",
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Create workspace
                </button>
              )}
              {workspaces.length > 0 && (
                <button
                  onClick={handleSelectContinue}
                  disabled={!selected}
                  style={{
                    background: selected ? "#7c3aed" : "rgba(124,58,237,0.3)",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 20px",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: selected ? "pointer" : "not-allowed",
                    transition: "all 0.13s",
                  }}
                >
                  Continue →
                </button>
              )}
            </div>
          </>
        )}

        {/* ── CREATE VIEW ── */}
        {view === "create" && (
          <CreateWorkspaceView
            onCreated={handleCreated}
            onBack={() => setView("select")}
          />
        )}

        {/* ── REVEAL VIEW ── */}
        {view === "reveal" && createdResult && (
          <ApiKeyRevealView result={createdResult} onContinue={handleContinue} />
        )}
      </div>

      {/* Footer status bar */}
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10b981",
            display: "inline-block",
          }}
        />
        <span style={{ color: "#4b5563", fontSize: 12 }}>
          Aura Proxy Network: Operational
        </span>
        <span style={{ color: "#374151", fontSize: 12 }}>|</span>
        <span style={{ color: "#4b5563", fontSize: 12 }}>v2.4.1</span>
      </div>
    </div>
  );
}
