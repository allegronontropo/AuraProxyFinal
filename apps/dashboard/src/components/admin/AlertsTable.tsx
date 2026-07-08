"use client";

import { useState, useTransition } from "react";
import { ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { bulkUpdateAdminAlertStatus } from "@/actions/admin";
import AdminAlertActions from "@/components/admin/AdminAlertActions";
import type { AlertStatus } from "@aura/shared";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; Icon: React.ElementType }> = {
  critical: { bg: "rgba(239,68,68,0.1)",  text: "#f87171", border: "rgba(239,68,68,0.25)",  Icon: ShieldAlert   },
  warning:  { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", Icon: AlertTriangle },
  info:     { bg: "rgba(99,179,237,0.1)", text: "#60a5fa", border: "rgba(99,179,237,0.25)", Icon: Info          },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active:       { bg: "rgba(239,68,68,0.08)",  text: "#f87171" },
  acknowledged: { bg: "rgba(245,158,11,0.08)", text: "#fbbf24" },
  resolved:     { bg: "rgba(34,197,94,0.08)",  text: "#4ade80" },
};

function timeAgo(dateStr: Date | string) {
  const date = new Date(dateStr);
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertRow {
  id: string;
  createdAt: Date | string;
  severity: string;
  status: string;
  title: string;
  description: string | null;
  source: string;
  project: { name: string; tenant: { email: string } | null };
}

interface Props {
  alerts: AlertRow[];
  sortHeaders: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AlertsTable({ alerts, sortHeaders }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const allChecked = alerts.length > 0 && alerts.every((a) => selected.has(a.id));
  const someChecked = alerts.some((a) => selected.has(a.id));

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(alerts.map((a) => a.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAction = (status: AlertStatus) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const actionLabel = status === "resolved" ? "Resolve" : "Acknowledge";
    if (!window.confirm(`${actionLabel} ${ids.length} selected alert(s)?`)) return;
    
    startTransition(async () => {
      setFeedback(null);
      const res = await bulkUpdateAdminAlertStatus(ids, status);
      if ("error" in res) {
        setFeedback(`Error: ${res.error}`);
      } else {
        setFeedback(`✓ ${res.count} alert(s) marked as ${status}.`);
        setSelected(new Set());
      }
    });
  };

  return (
    <div>
      {/* Bulk action bar */}
      {someChecked && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <span className="text-[12px] text-violet-300 font-medium">
            {selected.size} selected
          </span>
          <div className="h-3 w-px bg-violet-500/30" />
          <button
            onClick={() => handleBulkAction("acknowledged")}
            disabled={isPending}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer
              bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
          >
            Acknowledge Selected
          </button>
          <button
            onClick={() => handleBulkAction("resolved")}
            disabled={isPending}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer
              bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
          >
            Resolve Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors ml-auto cursor-pointer bg-transparent border-none"
          >
            Clear
          </button>
        </div>
      )}

      {feedback && (
        <p className={`text-[11px] mb-3 px-3 py-2 rounded-lg border ${
          feedback.startsWith("✓")
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {feedback}
        </p>
      )}

      {/* Table */}
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/[0.05]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 cursor-pointer accent-violet-500"
                />
              </th>
              {sortHeaders}
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => {
              const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
              const st  = STATUS_STYLES[alert.status]   ?? STATUS_STYLES.active;
              const Icon = sev.Icon;
              const isSelected = selected.has(alert.id);
              
              return (
                <tr 
                  key={alert.id} 
                  className={`border-b border-white/[0.04] transition-colors ${
                    isSelected ? "bg-violet-500/[0.06]" : (alert.status === "active" ? "hover:bg-red-500/[0.025]" : "hover:bg-white/[0.02]")
                  }`}
                >
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(alert.id)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 cursor-pointer accent-violet-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-white/30 text-[12px] whitespace-nowrap font-mono">{timeAgo(alert.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="text-white/80 text-[13px] font-medium">{alert.project.name}</div>
                    <div className="text-white/30 text-[11px] font-mono">{alert.project.tenant?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                      <Icon size={10} />{alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: st.bg, color: st.text }}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="text-white/90 text-[13px] font-medium leading-snug">{alert.title}</div>
                    <div className="text-white/40 text-[11px] mt-0.5 line-clamp-1">{alert.description}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[11px] text-white/40 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded font-mono">
                      {alert.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AdminAlertActions alertId={alert.id} currentStatus={alert.status as "active" | "acknowledged" | "resolved"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
