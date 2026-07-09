"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { bulkToggleUserSuspension } from "@/actions/admin";
import { buildAdminUrl, nextSort } from "@/lib/admin-table";
import UserActions from "@/components/admin/UserActions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  plan: string;
  isActive: boolean;
  created_at: Date | string;
  totalRequests: number;
  totalCost: number;
  totalApiKeys: number;
  _count: { projects: number };
}

interface Props {
  users: UserRow[];
  sortBy: string;
  sortDir: string;
  page: number;
  totalPages: number;
  total: number;
  urlParams: Record<string, string | undefined>;
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: string }) {
  if (sortBy !== field) return <ChevronsUpDown size={11} className="text-white/20 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp size={11} className="text-violet-400 ml-1 inline" />
    : <ChevronDown size={11} className="text-violet-400 ml-1 inline" />;
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  FREE:       { bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
  PRO:        { bg: "rgba(124,92,252,0.12)",  text: "#a78bfa" },
  ENTERPRISE: { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersTable({
  users, sortBy, sortDir, page, totalPages, total, urlParams,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const allChecked = users.length > 0 && users.every((u) => selected.has(u.id));
  const someChecked = users.some((u) => selected.has(u.id));

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(users.map((u) => u.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAction = (isActive: boolean) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const label = isActive ? "activate" : "suspend";
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${ids.length} selected user(s)?`)) return;
    startTransition(async () => {
      setFeedback(null);
      const res = await bulkToggleUserSuspension(ids, isActive);
      if ("error" in res) {
        setFeedback(`Error: ${res.error}`);
      } else {
        setFeedback(`✓ ${res.count} user(s) ${label}d.`);
        setSelected(new Set());
      }
    });
  };

  // Build sort href
  const sortHref = (field: string) => {
    const { sortBy: sb, sortDir: sd } = nextSort(field, sortBy, sortDir);
    return buildAdminUrl("/admin/users", urlParams, { sortBy: sb, sortDir: sd, page: "1" });
  };

  // Build page href
  const pageHref = (p: number) =>
    buildAdminUrl("/admin/users", urlParams, { page: String(p) });

  const COLUMNS: { label: string; field: string | null }[] = [
    { label: "Name",     field: "name"     },
    { label: "Email",    field: "email"    },
    { label: "Status",   field: "isActive" },
    { label: "Plan",     field: "plan"     },
    { label: "Projects", field: "projects" },
    { label: "Requests", field: null       }, // computed, not server-sortable
    { label: "Cost",     field: "cost"     }, 
    { label: "Joined",   field: "createdAt"},
    { label: "Actions",  field: null       },
  ];

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
            onClick={() => handleBulkAction(false)}
            disabled={isPending}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer
              bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
          >
            Suspend Selected
          </button>
          <button
            onClick={() => handleBulkAction(true)}
            disabled={isPending}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer
              bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
          >
            Activate Selected
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

      {/* Showing X–Y of Z */}
      <div className="text-[11px] text-white/30 mb-3">
        Showing {total === 0 ? 0 : (page - 1) * 14 + 1}–{Math.min(page * 14, total)} of {total} users
      </div>

      {/* Table */}
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/[0.05]">
              {/* Select all */}
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 cursor-pointer accent-violet-500"
                />
              </th>
              {COLUMNS.map(({ label, field }) => (
                <th key={label} className="px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">
                  {field ? (
                    <a href={sortHref(field)} className="inline-flex items-center hover:text-white/70 transition-colors no-underline text-inherit cursor-pointer">
                      {label}
                      <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
                    </a>
                  ) : (
                    <span className="text-white/25">{label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const planColors = PLAN_COLORS[user.plan] ?? PLAN_COLORS.FREE;
              const isSelected = selected.has(user.id);
              return (
                <tr
                  key={user.id}
                  className={`border-b border-white/[0.04] transition-colors ${
                    isSelected ? "bg-violet-500/[0.06]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(user.id)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 cursor-pointer accent-violet-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-white/50 font-mono text-[12px]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      style={user.isActive
                        ? { background: "rgba(16,185,129,0.1)", color: "#34d399" }
                        : { background: "rgba(239,68,68,0.1)",  color: "#f87171" }}
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: planColors.bg, color: planColors.text }}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40">{user._count.projects}</td>
                  <td className="px-4 py-3 text-white/40">{user.totalRequests.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">${user.totalCost.toFixed(4)}</td>
                  <td className="px-4 py-3 text-white/30 text-[12px]">
                    {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <UserActions userId={user.id} isActive={user.isActive} />
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center">
                  <div className="text-white/20 text-4xl mb-3">- -</div>
                  <div className="text-white/40 text-sm">No users found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 ? (
            <a href={pageHref(page - 1)} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">
              ← Prev
            </a>
          ) : (
            <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">← Prev</span>
          )}

          <div className="flex items-center gap-1">
            {/* Show max 7 page buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="text-white/20 px-1 text-sm">…</span>
                ) : (
                  <a
                    key={p}
                    href={pageHref(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm no-underline transition-colors ${
                      p === page ? "bg-violet-600 text-white font-medium" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {p}
                  </a>
                )
              )}
          </div>

          {page < totalPages ? (
            <a href={pageHref(page + 1)} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">
              Next →
            </a>
          ) : (
            <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">Next →</span>
          )}
        </div>
      )}
    </div>
  );
}
