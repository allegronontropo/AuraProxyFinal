import { prisma } from "@aura/db";
import { Zap, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  openai:    { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  anthropic: { bg: "bg-amber-500/10",   text: "text-amber-400"   },
  google:    { bg: "bg-blue-500/10",    text: "text-blue-400"    },
  mistral:   { bg: "bg-orange-500/10",  text: "text-orange-400"  },
  cohere:    { bg: "bg-teal-500/10",    text: "text-teal-400"    },
  groq:      { bg: "bg-violet-500/10",  text: "text-violet-400"  },
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildUrl(
  current: Record<string, string | undefined>,
  updates: Record<string, string | undefined>
): string {
  const merged = { ...current, ...updates };
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join("&");
  return `/admin/traces${qs ? `?${qs}` : ""}`;
}

function SortIcon({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: string }) {
  if (sortBy !== field) return <ChevronsUpDown size={11} className="text-white/20 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp   size={11} className="text-violet-400 ml-1 inline" />
    : <ChevronDown size={11} className="text-violet-400 ml-1 inline" />;
}

function SortTh({
  label, field, sortBy, sortDir, urlParams,
}: {
  label: string; field: string | null;
  sortBy: string; sortDir: string;
  urlParams: Record<string, string | undefined>;
}) {
  if (!field) {
    return (
      <th className="px-3 py-3 text-[11px] font-semibold text-white/25 uppercase tracking-wider whitespace-nowrap">
        {label}
      </th>
    );
  }
  const nextDir = sortBy === field && sortDir === "asc" ? "desc" : "asc";
  const href = buildUrl(urlParams, { sortBy: field, sortDir: nextDir, page: "1" });
  return (
    <th className="px-3 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">
      <Link href={href} className="inline-flex items-center hover:text-white/70 transition-colors no-underline text-inherit">
        {label}<SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
      </Link>
    </th>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default async function AdminTracesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await props.searchParams;
  const params = {
    model:    (raw.model    as string) || "",
    status:   (raw.status   as string) || "",
    project:  (raw.project  as string) || "",
    provider: (raw.provider as string) || "",
    cache:    (raw.cache    as string) || "",
    page:     (raw.page     as string) || "1",
    sortBy:   (raw.sortBy   as string) || "createdAt",
    sortDir:  (raw.sortDir  as string) || "desc",
  };

  const page    = Math.max(1, parseInt(params.page) || 1);
  const sortDir = (params.sortDir === "asc" ? "asc" : "desc") as "asc" | "desc";

  // ─── Where ────────────────────────────────────────────────────────────────
  const where: import("@prisma/client").Prisma.RequestLogWhereInput = {};
  if (params.model)    where.model    = { contains: params.model, mode: "insensitive" };
  if (params.status === "200")   where.statusCode = 200;
  else if (params.status === "error") where.statusCode = { not: 200 };
  if (params.project)  where.project  = { name: { contains: params.project, mode: "insensitive" } };
  if (params.provider) where.provider = params.provider;
  if (params.cache === "hit")  where.cached = true;
  else if (params.cache === "miss") where.cached = false;

  // ─── Order by ────────────────────────────────────────────────────────────
  const ORDER_MAP: Record<string, import("@prisma/client").Prisma.RequestLogOrderByWithRelationInput> = {
    createdAt:  { createdAt:  sortDir },
    provider:   { provider:   sortDir },
    model:      { model:      sortDir },
    latencyMs:  { latencyMs:  sortDir },
    costUsd:    { costUsd:    sortDir },
    statusCode: { statusCode: sortDir },
    cached:     { cached:     sortDir },
  };
  const orderBy = ORDER_MAP[params.sortBy] ?? { createdAt: "desc" };

  const [traces, total] = await Promise.all([
    prisma.requestLog.findMany({
      where, orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { project: { select: { name: true } } },
    }),
    prisma.requestLog.count({ where }),
  ]);

  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo   = Math.min(page * PAGE_SIZE, total);
  const hasFilters  = params.model || params.status || params.project || params.provider || params.cache;

  // URL param map for sort/page link builder (strip page, preserve filters+sort)
  const urlParams: Record<string, string | undefined> = {
    ...(params.model    ? { model:    params.model    } : {}),
    ...(params.status   ? { status:   params.status   } : {}),
    ...(params.project  ? { project:  params.project  } : {}),
    ...(params.provider ? { provider: params.provider } : {}),
    ...(params.cache    ? { cache:    params.cache    } : {}),
    sortBy:  params.sortBy,
    sortDir: params.sortDir,
  };

  const COLS: { label: string; field: string | null }[] = [
    { label: "Time",     field: "createdAt"  },
    { label: "Project",  field: null         },
    { label: "Provider", field: "provider"   },
    { label: "Model",    field: "model"      },
    { label: "Auth",     field: null         },
    { label: "Cache",    field: null         },
    { label: "LLM",      field: null         },
    { label: "Total",    field: "latencyMs"  },
    { label: "Cache Hit",field: "cached"     },
    { label: "Cost",     field: "costUsd"    },
    { label: "Status",   field: "statusCode" },
  ];

  return (
    <div className="px-10 py-8 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-1 flex items-center gap-2">
            <Zap size={20} className="text-white/30" /> System Traces
          </h1>
          <p className="text-sm text-white/40">Deep observability into proxy latencies, caching, and model routing.</p>
        </div>
      </div>

      {/* Filter form */}
      <form method="GET" className="flex gap-2.5 mb-4 flex-wrap">
        <input type="hidden" name="sortBy"  value={params.sortBy}  />
        <input type="hidden" name="sortDir" value={params.sortDir} />
        <input type="text" name="model" placeholder="Filter by model (e.g. gpt-4)" defaultValue={params.model}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 w-48" />
        <input type="text" name="project" placeholder="Project name…" defaultValue={params.project}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 w-40" />
        <select name="provider" defaultValue={params.provider}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 transition-colors cursor-pointer">
          <option value="" className="bg-[#0a0a0c]">All Providers</option>
          {["openai","anthropic","google","mistral","cohere","groq"].map((p) => (
            <option key={p} value={p} className="bg-[#0a0a0c]">{p.charAt(0).toUpperCase()+p.slice(1)}</option>
          ))}
        </select>
        <select name="cache" defaultValue={params.cache}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 cursor-pointer">
          <option value="" className="bg-[#0a0a0c]">All Cache</option>
          <option value="hit" className="bg-[#0a0a0c]">Cache Hit</option>
          <option value="miss" className="bg-[#0a0a0c]">Cache Miss</option>
        </select>
        <select name="status" defaultValue={params.status}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 cursor-pointer">
          <option value="" className="bg-[#0a0a0c]">All Statuses</option>
          <option value="200" className="bg-[#0a0a0c]">Success (200)</option>
          <option value="error" className="bg-[#0a0a0c]">Errors</option>
        </select>
        <button type="submit"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer">
          Filter
        </button>
        {hasFilters && (
          <a href="/admin/traces" className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline flex items-center transition-colors">
            Clear
          </a>
        )}
      </form>

      {/* Record count */}
      <div className="text-[11px] text-white/30 mb-3">
        Showing {showingFrom.toLocaleString()}–{showingTo.toLocaleString()} of {total.toLocaleString()}
      </div>

      {/* Table */}
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/[0.05]">
              {COLS.map(({ label, field }) => (
                <SortTh key={label} label={label} field={field} sortBy={params.sortBy} sortDir={params.sortDir} urlParams={urlParams} />
              ))}
            </tr>
          </thead>
          <tbody>
            {traces.map((trace) => {
              const totalLat = trace.latencyMs || 1;
              const authPct  = trace.authLatencyMs  ? Math.min((trace.authLatencyMs  / totalLat) * 100, 100) : 0;
              const cachePct = trace.cacheLatencyMs ? Math.min((trace.cacheLatencyMs / totalLat) * 100, 100) : 0;
              const llmPct   = trace.llmLatencyMs   ? Math.min((trace.llmLatencyMs   / totalLat) * 100, 100) : 0;
              const provColor = PROVIDER_COLORS[trace.provider] || { bg: "bg-white/5", text: "text-white/50" };
              return (
                <tr key={trace.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 text-white/40 text-[12px] whitespace-nowrap">{timeAgo(trace.createdAt)}</td>
                  <td className="px-3 py-2.5 text-white/80 text-[12px] max-w-[110px] truncate">{trace.project?.name || "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${provColor.bg} ${provColor.text}`}>
                      {trace.provider}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-white/80 text-[12px] max-w-[130px] truncate">{trace.model}</td>
                  {/* Auth latency bar */}
                  <td className="px-3 py-2.5 text-white/50 text-[12px] min-w-[100px]">
                    {trace.authLatencyMs == null ? <span className="text-white/20 italic">—</span> : (
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-[32px] text-[11px]">{trace.authLatencyMs}ms</span>
                        <div className="flex-1 h-1 bg-white/[0.06] rounded-full min-w-[24px]">
                          <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${authPct}%` }} />
                        </div>
                      </div>
                    )}
                  </td>
                  {/* Cache latency bar */}
                  <td className="px-3 py-2.5 text-white/50 text-[12px] min-w-[100px]">
                    {trace.cacheLatencyMs == null ? <span className="text-white/20 italic">—</span> : (
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-[32px] text-[11px]">{trace.cacheLatencyMs}ms</span>
                        <div className="flex-1 h-1 bg-white/[0.06] rounded-full min-w-[24px]">
                          <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${cachePct}%` }} />
                        </div>
                      </div>
                    )}
                  </td>
                  {/* LLM latency bar */}
                  <td className="px-3 py-2.5 text-white/50 text-[12px] min-w-[100px]">
                    {trace.llmLatencyMs == null ? <span className="text-white/20 italic">—</span> : (
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-[32px] text-[11px]">{trace.llmLatencyMs}ms</span>
                        <div className="flex-1 h-1 bg-white/[0.06] rounded-full min-w-[24px]">
                          <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${llmPct}%` }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-white font-medium text-[12px] whitespace-nowrap">{trace.latencyMs}ms</td>
                  <td className="px-3 py-2.5">
                    {trace.cached
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">HIT</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-white/5 text-white/30 border border-white/10">MISS</span>}
                  </td>
                  <td className="px-3 py-2.5 text-emerald-400/80 text-[12px] font-mono">
                    {trace.costUsd != null ? `$${trace.costUsd.toFixed(6)}` : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${trace.statusCode === 200 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {trace.statusCode}
                    </span>
                  </td>
                </tr>
              );
            })}
            {traces.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center">
                  <div className="text-white/20 text-4xl mb-3">- -</div>
                  <div className="text-white/40 text-sm">{hasFilters ? "No traces match the current filters." : "No traces recorded yet."}</div>
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
            ? <Link href={buildUrl(urlParams, { page: String(page - 1) })} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">← Previous</Link>
            : <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">← Previous</span>}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p); return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={`e${i}`} className="text-white/20 px-1 text-sm">…</span>
                : <Link key={p} href={buildUrl(urlParams, { page: String(p) })}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm no-underline transition-colors ${p === page ? "bg-violet-600 text-white font-medium" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"}`}>
                    {p}
                  </Link>
              )}
          </div>
          {page < totalPages
            ? <Link href={buildUrl(urlParams, { page: String(page + 1) })} className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors">Next →</Link>
            : <span className="bg-white/[0.02] text-white/20 px-4 py-2 rounded-lg text-sm cursor-not-allowed">Next →</span>}
        </div>
      )}
    </div>
  );
}
