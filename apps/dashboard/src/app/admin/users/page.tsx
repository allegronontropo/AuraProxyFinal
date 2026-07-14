import { prisma } from "@aura/db";
import { Users } from "lucide-react";
import UsersTable from "@/components/admin/UsersTable";

const PAGE_SIZE = 14;

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await props.searchParams;
  const query   = (sp.query   as string) || "";
  const status  = (sp.status  as string) || "";
  const sortBy  = (sp.sortBy  as string) || "createdAt";
  const sortDir = ((sp.sortDir as string) === "asc" ? "asc" : "desc") as "asc" | "desc";
  const page    = Math.max(1, parseInt((sp.page as string) || "1") || 1);

  // ─── Where clause ─────────────────────────────────────────────────────────
  const where: import("@prisma/client").Prisma.UserWhereInput = {};
  if (query) {
    where.OR = [
      { email: { contains: query, mode: "insensitive" } },
      { name:  { contains: query, mode: "insensitive" } },
    ];
  }
  if (status === "active")    where.isActive = true;
  if (status === "suspended") where.isActive = false;

  // ─── Order by ─────────────────────────────────────────────────────────────
  const ORDER_MAP: Record<string, import("@prisma/client").Prisma.UserOrderByWithRelationInput> = {
    name:      { name:       sortDir },
    email:     { email:      sortDir },
    plan:      { plan:       sortDir },
    isActive:  { isActive:   sortDir },
    sendAlerts:{ sendAlerts: sortDir },
    createdAt: { created_at: sortDir },
    projects:  { projects: { _count: sortDir } },
  };
  const orderBy = ORDER_MAP[sortBy] ?? { created_at: "desc" };

  // ─── Fetch data ────────────────────────────────────────────────────────────
  // If sorting by cost, we fetch all matching users to sort them in-memory
  const [total, allOrPageUsers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: sortBy === "cost" ? undefined : orderBy,
      skip: sortBy === "cost" ? undefined : (page - 1) * PAGE_SIZE,
      take: sortBy === "cost" ? undefined : PAGE_SIZE,
      include: {
        _count: { select: { projects: true } },
        projects: {
          include: { _count: { select: { apiKeys: true, logs: true } } },
        },
      },
    }),
  ]);

  // ─── Optimize cost calculation ──────────────────────────────────────────────
  const projectCosts = await prisma.requestLog.groupBy({
    by: ["projectId"],
    _sum: { costUsd: true },
  });
  const costMap = new Map(projectCosts.map(p => [p.projectId, p._sum.costUsd || 0]));

  // ─── Compute per-user metrics ─────────────────────────────────────────────
  let usersWithMetrics = allOrPageUsers.map((user) => {
    let totalCost = 0, totalRequests = 0, totalApiKeys = 0;
    for (const project of user.projects) {
      totalRequests += project._count.logs;
      totalApiKeys  += project._count.apiKeys;
      totalCost += costMap.get(project.id) || 0;
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      isActive: user.isActive,
      sendAlerts: user.sendAlerts,
      created_at: user.created_at.toISOString(),
      totalCost,
      totalRequests,
      totalApiKeys,
      _count: user._count,
    };
  });

  if (sortBy === "cost") {
    usersWithMetrics.sort((a, b) => {
      return sortDir === "asc" ? a.totalCost - b.totalCost : b.totalCost - a.totalCost;
    });
    usersWithMetrics = usersWithMetrics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(query || status);

  // Pass current URL params to table for building sort/page hrefs
  const urlParams: Record<string, string | undefined> = {
    ...(query  ? { query  } : {}),
    ...(status ? { status } : {}),
    sortBy,
    sortDir,
  };

  return (
    <div className="px-10 py-8 max-w-[1300px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1 flex items-center gap-2">
          <Users size={20} className="text-white/30" />
          Users Directory
          <span className="ml-2 text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full">{total}</span>
        </h1>
        <p className="text-sm text-white/40">
          Complete list of all users registered on the platform.
        </p>
      </div>

      {/* Filter Form */}
      <form method="GET" className="flex gap-3 mb-6 flex-wrap items-center">
        <input type="hidden" name="sortBy"  value={sortBy}  />
        <input type="hidden" name="sortDir" value={sortDir} />
        <input
          type="text" name="query" placeholder="Search by name or email…"
          defaultValue={query}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 transition-colors w-72"
        />
        <select name="status" defaultValue={status}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-violet-500/50 transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22></3Cpolyline></svg%3E')] bg-no-repeat bg-[right_12px_center] pr-10">
          <option value="" className="bg-[#0a0a0c]">All Statuses</option>
          <option value="active" className="bg-[#0a0a0c]">Active</option>
          <option value="suspended" className="bg-[#0a0a0c]">Suspended</option>
        </select>
        <button type="submit"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer">
          Search
        </button>
        {hasFilters && (
          <a href="/admin/users" className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors no-underline">
            Clear
          </a>
        )}
      </form>

      <UsersTable
        users={usersWithMetrics}
        sortBy={sortBy}
        sortDir={sortDir}
        page={page}
        totalPages={totalPages}
        total={total}
        urlParams={urlParams}
      />
    </div>
  );
}
