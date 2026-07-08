import { prisma } from "@aura/db";
import { Key, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import BulkRateLimitControl from "@/components/admin/BulkRateLimitControl";
import AdminApiKeysTable from "@/components/admin/AdminApiKeysTable";

const PAGE_SIZE = 20;

function buildUrl(
  current: Record<string, string | undefined>,
  updates: Record<string, string | undefined>
): string {
  const merged = { ...current, ...updates };
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join("&");
  return `/admin/api-keys${qs ? `?${qs}` : ""}`;
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
      <th className="px-4 py-3 text-[11px] font-semibold text-white/25 uppercase tracking-wider whitespace-nowrap">
        {label}
      </th>
    );
  }
  const nextDir = sortBy === field && sortDir === "asc" ? "desc" : "asc";
  const href = buildUrl(urlParams, { sortBy: field, sortDir: nextDir, page: "1" });
  return (
    <th className="px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">
      <a href={href} className="inline-flex items-center hover:text-white/70 transition-colors no-underline text-inherit cursor-pointer">
        {label}
        {sortBy === field
          ? sortDir === "asc"
            ? <ChevronUp size={11} className="text-violet-400 ml-1" />
            : <ChevronDown size={11} className="text-violet-400 ml-1" />
          : <ChevronsUpDown size={11} className="text-white/20 ml-1" />
        }
      </a>
    </th>
  );
}

export default async function AdminApiKeysPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await props.searchParams;
  const sortBy  = (raw.sortBy  as string) || "createdAt";
  const sortDir = ((raw.sortDir as string) === "asc" ? "asc" : "desc") as "asc" | "desc";
  const page    = Math.max(1, parseInt((raw.page as string) || "1") || 1);
  const query   = (raw.query   as string) || "";

  const ORDER_MAP: Record<string, import("@prisma/client").Prisma.ApiKeyOrderByWithRelationInput> = {
    name:        { name:       sortDir },
    rateLimit:   { rateLimit:  sortDir },
    isActive:    { isActive:   sortDir },
    lastUsedAt:  { lastUsedAt: sortDir },
    createdAt:   { createdAt:  sortDir },
  };
  const orderBy = ORDER_MAP[sortBy] ?? { createdAt: "desc" };

  const where: import("@prisma/client").Prisma.ApiKeyWhereInput = {};
  if (query) {
    where.OR = [
      { name:    { contains: query, mode: "insensitive" } },
      { project: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  const [total, apiKeys] = await Promise.all([
    prisma.apiKey.count({ where }),
    prisma.apiKey.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        project: {
          select: { name: true, tenant: { select: { email: true } } },
        },
      },
    }),
  ]);

  const [totalActive, totalSuspended, rateLimitAgg] = await Promise.all([
    prisma.apiKey.count({ where: { isActive: true  } }),
    prisma.apiKey.count({ where: { isActive: false } }),
    prisma.apiKey.aggregate({ _avg: { rateLimit: true } }),
  ]);

  const avgRateLimit = Math.round(rateLimitAgg._avg.rateLimit ?? 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilter  = !!query;

  const urlParams: Record<string, string | undefined> = {
    ...(query ? { query } : {}),
    sortBy, sortDir,
  };

  return (
    <div className="px-10 py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1 flex items-center gap-2">
          <Key size={20} className="text-white/30" />
          API Keys
          <span className="ml-2 text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full">{total}</span>
        </h1>
        <p className="text-sm text-white/40">Platform-wide API key management and rate limiting</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Keys",    value: totalActive,    color: "#4ade80" },
          { label: "Suspended Keys", value: totalSuspended, color: totalSuspended > 0 ? "#f87171" : "#4ade80" },
          { label: "Avg RPM Limit",  value: avgRateLimit,   color: "#a78bfa" },
        ].map((c) => (
          <div key={c.label} className="bg-white/[0.015] border border-white/[0.08] rounded-xl px-5 py-4 flex flex-col gap-1">
            <div className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">{c.label}</div>
            <div className="text-[28px] font-bold tracking-tight" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-amber-400">⚠</span> Safety Controls
        </div>
        <BulkRateLimitControl />
      </div>

      <form method="GET" className="flex gap-3 mb-3 flex-wrap">
        <input type="hidden" name="sortBy"  value={sortBy}  />
        <input type="hidden" name="sortDir" value={sortDir} />
        <input type="text" name="query" placeholder="Search by key name or project…" defaultValue={query}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 transition-colors w-72" />
        <button type="submit"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer">
          Search
        </button>
        {hasFilter && (
          <a href="/admin/api-keys" className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm no-underline transition-colors flex items-center">
            Clear
          </a>
        )}
      </form>

      <div className="text-[11px] text-white/30 mb-3">
        Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} keys
      </div>

      <AdminApiKeysTable
        apiKeys={apiKeys}
        sortHeaders={
          <>
            <SortTh label="Key Prefix" field={null} sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
            <SortTh label="Name" field="name" sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
            <SortTh label="Project" field={null} sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
            <SortTh label="Owner Email" field={null} sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
            <SortTh label="Rate Limit (RPM)" field="rateLimit" sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
            <SortTh label="Status" field="isActive" sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
            <SortTh label="Last Used" field="lastUsedAt" sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
            <SortTh label="Created" field="createdAt" sortBy={sortBy} sortDir={sortDir} urlParams={urlParams} />
          </>
        }
      />

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
    </div>
  );
}
