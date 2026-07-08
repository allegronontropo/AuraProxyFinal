import { prisma } from "@aura/db";
import { FolderOpen } from "lucide-react";
import ProjectsTable from "@/components/admin/ProjectsTable";
import BulkBudgetControl from "@/components/admin/BulkBudgetControl";

const PAGE_SIZE = 14;

export default async function AdminProjectsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await props.searchParams;
  const query   = (sp.query   as string) || "";
  const sortBy  = (sp.sortBy  as string) || "createdAt";
  const sortDir = ((sp.sortDir as string) === "asc" ? "asc" : "desc") as "asc" | "desc";
  const page    = Math.max(1, parseInt((sp.page as string) || "1") || 1);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ─── Where ────────────────────────────────────────────────────────────────
  const where: import("@prisma/client").Prisma.ProjectWhereInput = {};
  if (query) where.name = { contains: query, mode: "insensitive" };

  // ─── Order by ─────────────────────────────────────────────────────────────
  const ORDER_MAP: Record<string, import("@prisma/client").Prisma.ProjectOrderByWithRelationInput> = {
    name:        { name:        sortDir },
    email:       { tenant: { email: sortDir } },
    budgetLimit: { budgetLimit: sortDir },
    isActive:    { isActive:    sortDir },
    createdAt:   { createdAt:   sortDir },
  };
  const orderBy = ORDER_MAP[sortBy] ?? { createdAt: "desc" };

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        tenant: { select: { email: true, name: true } },
        _count: { select: { apiKeys: true, logs: true } },
      },
    }),
  ]);

  // ─── Compute metrics ──────────────────────────────────────────────────────
  const projectsWithMetrics = await Promise.all(
    projects.map(async (project) => {
      const agg = await prisma.requestLog.aggregate({
        where: { projectId: project.id, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
        _sum: { costUsd: true },
      });
      const cost30d      = agg._sum.costUsd ?? 0;
      const budgetLimit  = project.budgetLimit ?? 100;
      const usagePercent = Math.min((cost30d / budgetLimit) * 100, 100);

      let healthLabel: "healthy" | "warning" | "over" | "suspended";
      if (!project.isActive)       healthLabel = "suspended";
      else if (usagePercent > 90)  healthLabel = "over";
      else if (usagePercent > 75)  healthLabel = "warning";
      else                         healthLabel = "healthy";

      return {
        id:           project.id,
        name:         project.name,
        budgetLimit:  project.budgetLimit,
        budgetPeriod: project.budgetPeriod,
        isActive:     project.isActive,
        createdAt:    project.createdAt.toISOString(),
        requests30d:  agg._count,
        cost30d,
        usagePercent,
        healthLabel,
        tenant: {
          email: project.tenant?.email ?? null,
          name:  project.tenant?.name  ?? null,
        },
      };
    })
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!query;

  const urlParams: Record<string, string | undefined> = {
    ...(query ? { query } : {}),
    sortBy,
    sortDir,
  };

  return (
    <div className="px-10 py-8 max-w-[1300px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1 flex items-center gap-2">
          <FolderOpen size={20} className="text-white/30" />
          Workspaces Directory
          <span className="ml-2 text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full">{total}</span>
        </h1>
        <p className="text-sm text-white/40">
          Complete list of all projects and workspaces across the platform.
        </p>
      </div>

      {/* Safety Controls */}
      <div className="mb-6">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-amber-400">⚠</span> Safety Controls
        </div>
        <BulkBudgetControl />
      </div>

      {/* Filter Form */}
      <form method="GET" className="flex gap-3 mb-6 flex-wrap">
        <input type="hidden" name="sortBy"  value={sortBy}  />
        <input type="hidden" name="sortDir" value={sortDir} />
        <input
          type="text" name="query" placeholder="Search projects by name…"
          defaultValue={query}
          className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500/50 transition-colors w-72"
        />
        <button type="submit"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer">
          Search
        </button>
        {hasFilters && (
          <a href="/admin/projects" className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors no-underline flex items-center">
            Clear
          </a>
        )}
      </form>

      <ProjectsTable
        projects={projectsWithMetrics}
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
