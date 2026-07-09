"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, DollarSign } from "lucide-react";
import {
  bulkToggleProjectSuspension,
  bulkSetSelectedProjectBudgets,
} from "@/actions/admin";
import { buildAdminUrl, nextSort } from "@/lib/admin-table";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectRow {
  id: string;
  name: string;
  budgetLimit: number | null;
  budgetPeriod: string;
  isActive: boolean;
  createdAt: Date | string;
  requests30d: number;
  cost30d: number;
  usagePercent: number;
  healthLabel: "healthy" | "warning" | "over" | "suspended";
  tenant: { email: string | null; name: string | null } | null;
}

interface Props {
  projects: ProjectRow[];
  sortBy: string;
  sortDir: string;
  page: number;
  totalPages: number;
  total: number;
  urlParams: Record<string, string | undefined>;
}

const HEALTH_STYLES = {
  healthy:   { bg: "rgba(16,185,129,0.1)",  text: "#34d399", label: "Healthy"   },
  warning:   { bg: "rgba(245,158,11,0.1)",  text: "#fbbf24", label: "Warning"   },
  over:      { bg: "rgba(239,68,68,0.1)",   text: "#f87171", label: "Over Budget"},
  suspended: { bg: "rgba(107,114,128,0.1)", text: "#9ca3af", label: "Suspended" },
};

function SortIcon({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: string }) {
  if (sortBy !== field) return <ChevronsUpDown size={11} className="text-white/20 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp   size={11} className="text-violet-400 ml-1 inline" />
    : <ChevronDown size={11} className="text-violet-400 ml-1 inline" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectsTable({
  projects, sortBy, sortDir, page, totalPages, total, urlParams,
}: Props) {
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [budgetInput, setBudgetInput] = useState("100");
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback]     = useState<string | null>(null);

  const allChecked  = projects.length > 0 && projects.every((p) => selected.has(p.id));
  const someChecked = projects.some((p) => selected.has(p.id));

  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(projects.map((p) => p.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) }; return n; });

  const run = (fn: () => Promise<{ success: boolean; count: number } | { error: string }>, msg: string) => {
    startTransition(async () => {
      setFeedback(null);
      const res = await fn();
      if ("error" in res) {
        setFeedback(`Error: ${res.error}`);
      } else {
        setFeedback(`✓ ${msg}`);
        setSelected(new Set());
        setShowBudgetInput(false);
      }
    });
  };

  const handleSuspend   = () => {
    if (!selected.size) return;
    if (!window.confirm(`Suspend ${selected.size} project(s)?`)) return;
    run(() => bulkToggleProjectSuspension(Array.from(selected), false), `${selected.size} project(s) suspended.`);
  };
  const handleActivate  = () => {
    if (!selected.size) return;
    if (!window.confirm(`Activate ${selected.size} project(s)?`)) return;
    run(() => bulkToggleProjectSuspension(Array.from(selected), true), `${selected.size} project(s) activated.`);
  };
  const handleSetBudget = () => {
    const num = parseFloat(budgetInput);
    if (isNaN(num) || num <= 0) { setFeedback("Enter a valid dollar amount."); return; }
    if (!window.confirm(`Set budget to $${num} for ${selected.size} project(s)?`)) return;
    run(() => bulkSetSelectedProjectBudgets(Array.from(selected), num), `Budget set to $${num} for ${selected.size} project(s).`);
  };

  const sortHref = (field: string) => {
    const { sortBy: sb, sortDir: sd } = nextSort(field, sortBy, sortDir);
    return buildAdminUrl("/admin/projects", urlParams, { sortBy: sb, sortDir: sd, page: "1" });
  };
  const pageHref = (p: number) => buildAdminUrl("/admin/projects", urlParams, { page: String(p) });

  const COLUMNS: { label: string; field: string | null }[] = [
    { label: "Project",       field: "name"        },
    { label: "Owner",         field: "email"       },
    { label: "Budget",        field: "budgetLimit" },
    { label: "Requests (30d)",field: null          },
    { label: "Cost (30d)",    field: null          },
    { label: "Usage",         field: null          },
    { label: "Status",        field: "isActive"    },
    { label: "Created",       field: "createdAt"   },
  ];

  return (
    <div>
      {/* Bulk action bar */}
      {someChecked && (
        <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <span className="text-[12px] text-violet-300 font-medium">{selected.size} selected</span>
          <div className="h-3 w-px bg-violet-500/30" />
          <button onClick={handleSuspend} disabled={isPending}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20">
            Suspend
          </button>
          <button onClick={handleActivate} disabled={isPending}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">
            Activate
          </button>
          <button onClick={() => setShowBudgetInput((v) => !v)} disabled={isPending}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5">
            <DollarSign size={11} /> Set Budget
          </button>
          {showBudgetInput && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                <input type="number" min="1" step="1" value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="bg-white/5 border border-white/15 text-white rounded-lg pl-6 pr-2 py-1.5 text-xs w-24 outline-none focus:border-amber-500/50"
                  placeholder="100" />
              </div>
              <button onClick={handleSetBudget} disabled={isPending}
                className="text-[11px] bg-amber-600/70 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer border-none font-medium">
                Apply
              </button>
            </div>
          )}
          <button onClick={() => setSelected(new Set())}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors ml-auto cursor-pointer bg-transparent border-none">
            Clear
          </button>
        </div>
      )}

      {feedback && (
        <p className={`text-[11px] mb-3 px-3 py-2 rounded-lg border ${
          feedback.startsWith("✓")
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>{feedback}</p>
      )}

      <div className="text-[11px] text-white/30 mb-3">
        Showing {total === 0 ? 0 : (page - 1) * 14 + 1}–{Math.min(page * 14, total)} of {total} projects
      </div>

      {/* Table */}
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/[0.05]">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allChecked} onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 cursor-pointer accent-violet-500" />
              </th>
              {COLUMNS.map(({ label, field }) => (
                <th key={label} className="px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">
                  {field ? (
                    <a href={sortHref(field)} className="inline-flex items-center hover:text-white/70 transition-colors no-underline text-inherit cursor-pointer">
                      {label}<SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
                    </a>
                  ) : <span className="text-white/25">{label}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const h = HEALTH_STYLES[project.healthLabel];
              const isSelected = selected.has(project.id);
              return (
                <tr key={project.id} className={`border-b border-white/[0.04] transition-colors ${isSelected ? "bg-violet-500/[0.06]" : "hover:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleOne(project.id)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 cursor-pointer accent-violet-500" />
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{project.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-white/70 text-[13px]">{project.tenant?.name || "—"}</div>
                    <div className="text-white/30 text-[11px] font-mono">{project.tenant?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-white/50 font-mono text-[12px]">
                    ${project.budgetLimit?.toFixed(2) ?? "∞"} / {project.budgetPeriod.toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-white/40">{project.requests30d.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">${project.cost30d.toFixed(4)}</td>
                  <td className="px-4 py-3 min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${project.usagePercent}%`, background: h.text }} />
                      </div>
                      <span className="text-[11px] text-white/30 w-8 text-right">{Math.round(project.usagePercent)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: h.bg, color: h.text }}>
                      {h.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-[12px]">
                    {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="text-white/20 text-4xl mb-3">- -</div>
                  <div className="text-white/40 text-sm">No projects found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1
            ? <a href={pageHref(page - 1)} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">← Prev</a>
            : <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">← Prev</span>}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p); return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={`e-${i}`} className="text-white/20 px-1 text-sm">…</span>
                : <a key={p} href={pageHref(p as number)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm no-underline transition-colors ${p === page ? "bg-violet-600 text-white font-medium" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"}`}>{p}</a>
              )}
          </div>
          {page < totalPages
            ? <a href={pageHref(page + 1)} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">Next →</a>
            : <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">Next →</span>}
        </div>
      )}
    </div>
  );
}
