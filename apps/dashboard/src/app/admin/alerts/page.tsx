import { Bell, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import AlertsTable, { AlertRow } from "@/components/admin/AlertsTable";
import { getAllAlerts } from "@/actions/admin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;



function buildUrl(current: Record<string, string | undefined>, updates: Record<string, string | undefined>): string {
  const merged = { ...current, ...updates };
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join("&");
  return `/admin/alerts${qs ? `?${qs}` : ""}`;
}

function SortTh({
  label, field, sortBy, sortDir, urlParams,
  className = "",
}: {
  label: string; field: string | null;
  sortBy: string; sortDir: string;
  urlParams: Record<string, string | undefined>;
  className?: string;
}) {
  const base = `px-4 py-3 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${className}`;
  if (!field) return <th className={`${base} text-white/25`}>{label}</th>;

  const nextDir = sortBy === field && sortDir === "asc" ? "desc" : "asc";
  const href = buildUrl(urlParams, { sortBy: field, sortDir: nextDir, page: "1" });
  const isActive = sortBy === field;
  return (
    <th className={`${base} text-white/40`}>
      <a href={href} className="inline-flex items-center hover:text-white/70 transition-colors no-underline text-inherit cursor-pointer">
        {label}
        {isActive
          ? sortDir === "asc"
            ? <ChevronUp   size={11} className="text-violet-400 ml-1" />
            : <ChevronDown size={11} className="text-violet-400 ml-1" />
          : <ChevronsUpDown size={11} className="text-white/20 ml-1" />
        }
      </a>
    </th>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminAlertsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await props.searchParams;

  const severity = ((raw.severity as string) || "all").toLowerCase();
  const status   = ((raw.status   as string) || "all").toLowerCase();
  const project  = (raw.project   as string) || "";
  const sortBy   = (raw.sortBy    as string) || "createdAt";
  const sortDir  = ((raw.sortDir  as string) === "asc" ? "asc" : "desc") as "asc" | "desc";
  const page     = Math.max(1, parseInt((raw.page as string) || "1") || 1);

  // Fetch paginated slice + total count (separate unfiltered for stats)
  const [allUnfiltered, pageAlerts] = await Promise.all([
    getAllAlerts({}),
    getAllAlerts({
      severity, status,
      sortBy, sortDir,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  // Client-side project filter on the page slice
  const alerts = project
    ? pageAlerts.filter((a) => a.project?.name?.toLowerCase().includes(project.toLowerCase()))
    : pageAlerts;

  // Stats from full unfiltered set
  const statActive       = allUnfiltered.filter((a) => a.status === "active").length;
  const statAcknowledged = allUnfiltered.filter((a) => a.status === "acknowledged").length;
  const statResolved     = allUnfiltered.filter((a) => a.status === "resolved").length;
  const statCritical     = allUnfiltered.filter((a) => a.severity === "critical" && a.status === "active").length;

  // Total for pagination (need count without project name filter - server action doesn't expose count yet, use length heuristic)
  // We do a second call just for counting (no skip/take)
  const countResult = await getAllAlerts({ severity, status, sortBy, sortDir });
  const totalFiltered = countResult.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

  const urlParams: Record<string, string | undefined> = {
    ...(severity !== "all" ? { severity } : {}),
    ...(status   !== "all" ? { status   } : {}),
    ...(project             ? { project  } : {}),
    sortBy, sortDir,
  };

  const filterHref = (overrides: Record<string, string>) =>
    buildUrl({ ...urlParams, ...overrides }, { page: "1" });

  return (
    <div className="px-10 py-8 max-w-[1300px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Bell size={20} className="text-white/40" />
            <h1 className="text-2xl font-semibold text-white tracking-tight">Alert Queue</h1>
            {statActive > 0 && (
              <span className="flex items-center justify-center bg-red-500/15 text-red-400 rounded-full w-6 h-6 text-[11px] font-bold">
                {statActive}
              </span>
            )}
          </div>
          <p className="text-sm text-white/40">System-wide alerts across all projects and workspaces</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active",         value: statActive,       color: "#f87171" },
          { label: "Acknowledged",   value: statAcknowledged, color: "#fbbf24" },
          { label: "Resolved",       value: statResolved,     color: "#4ade80" },
          { label: "Critical Active",value: statCritical,     color: statCritical > 0 ? "#f87171" : "#4ade80" },
        ].map((c) => (
          <div key={c.label} className="bg-white/[0.015] border border-white/[0.08] rounded-xl px-5 py-4 flex flex-col gap-1">
            <div className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">{c.label}</div>
            <div className="text-[28px] font-bold tracking-tight" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-3">
        <input type="hidden" name="sortBy"  value={sortBy}  />
        <input type="hidden" name="sortDir" value={sortDir} />

        {/* Severity pills */}
        <div className="flex items-center gap-2">
          {(["all", "critical", "warning", "info"] as const).map((s) => (
            <a key={s} href={filterHref({ severity: s })}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors no-underline capitalize ${severity === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}>
              {s === "all" ? "All Severity" : s}
            </a>
          ))}
        </div>
        <div className="w-px h-4 bg-white/10" />
        {/* Status pills */}
        <div className="flex items-center gap-2">
          {(["all", "active", "acknowledged", "resolved"] as const).map((s) => (
            <a key={s} href={filterHref({ status: s })}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors no-underline capitalize ${status === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}>
              {s === "all" ? "All Status" : s}
            </a>
          ))}
        </div>
        <div className="w-px h-4 bg-white/10" />
        {/* Project search */}
        <input type="text" name="project" placeholder="Filter by project…" defaultValue={project}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm w-44 outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/25" />
        <button type="submit"
          className="bg-white/8 hover:bg-white/12 text-white/70 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-white/10 cursor-pointer">
          Search
        </button>
        {(project || severity !== "all" || status !== "all") && (
          <a href="/admin/alerts" className="text-white/40 hover:text-white/70 text-sm transition-colors no-underline">Clear</a>
        )}
      </form>

      <div className="text-[12px] text-white/30 mb-3">
        Showing {totalFiltered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered} alert{totalFiltered !== 1 ? "s" : ""}
        {severity !== "all" ? ` · ${severity}` : ""}{status !== "all" ? ` · ${status}` : ""}
      </div>

      {/* Table */}
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-xl overflow-hidden">
        {alerts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-white/15 text-5xl mb-4">🔕</div>
            <div className="text-white/30 text-sm font-medium">No alerts match these filters</div>
          </div>
        ) : (
          <AlertsTable 
            alerts={alerts.map(a => ({
              ...a,
              createdAt: a.createdAt.toISOString(),
            })) as unknown as AlertRow[]}
            sortHeaders={
              <>
                <SortTh label="Time"     field="createdAt" sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
                <th className="px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Project</th>
                <SortTh label="Severity" field="severity"  sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
                <SortTh label="Status"   field="status"    sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
                <th className="px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-white/25 uppercase tracking-wider">Actions</th>
              </>
            }
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1
            ? <a href={buildUrl(urlParams, { page: String(page - 1) })} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">← Prev</a>
            : <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">← Prev</span>}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p); return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={`e${i}`} className="text-white/20 px-1 text-sm">…</span>
                : <a key={p} href={buildUrl(urlParams, { page: String(p) })}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm no-underline transition-colors ${p === page ? "bg-violet-600 text-white font-medium" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"}`}>
                    {p}
                  </a>
              )}
          </div>
          {page < totalPages
            ? <a href={buildUrl(urlParams, { page: String(page + 1) })} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">Next →</a>
            : <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">Next →</span>}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="text-[11px] text-white/20 mt-3 text-right">Up to 500 most recent alerts</div>
      )}
    </div>
  );
}
