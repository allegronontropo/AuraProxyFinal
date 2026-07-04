import { prisma } from "@aura/db";
import ProjectActions from "@/components/admin/ProjectActions";

export default async function AdminProjectsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Construct Prisma where clause based on filters
  const where: any = {};
  if (searchParams.query) {
    where.name = { contains: searchParams.query as string, mode: "insensitive" };
  }

  // Fetch projects with their owner and aggregate metrics
  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: { email: true, name: true }
      },
      _count: {
        select: { apiKeys: true, logs: true }
      }
    }
  });

  // Calculate requests and cost over last 30 days
  const projectsWithMetrics = await Promise.all(
    projects.map(async (project) => {
      const logs30dAgg = await prisma.requestLog.aggregate({
        where: { 
          projectId: project.id,
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true,
        _sum: { costUsd: true }
      });

      // Calculate budget usage percentage
      const cost30d = logs30dAgg._sum.costUsd || 0;
      const budgetLimit = project.budgetLimit || 100; // Default or null handling
      const usagePercent = Math.min((cost30d / budgetLimit) * 100, 100);
      
      let status = "🟢 Healthy";
      if (!project.isActive) status = "⚫ Suspended";
      else if (usagePercent > 90) status = "🔴 Over Budget";
      else if (usagePercent > 75) status = "🟡 Warning";

      return {
        ...project,
        requests30d: logs30dAgg._count,
        cost30d,
        usagePercent,
        status
      };
    })
  );

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px 0" }}>Workspaces Directory</h1>
      <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 24px 0" }}>
        Complete list of all projects and workspaces across the platform.
      </p>

      {/* Filter Form */}
      <form method="GET" style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input 
          type="text" 
          name="query" 
          placeholder="Search projects by name..." 
          defaultValue={searchParams.query as string || ""} 
          style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", flex: 1, maxWidth: "300px" }} 
        />
        <button 
          type="submit" 
          style={{ padding: "8px 16px", borderRadius: "6px", background: "#8b5cf6", color: "white", fontWeight: 500, border: "none", cursor: "pointer" }}
        >
          Search
        </button>
        {searchParams.query && (
          <a href="/admin/projects" style={{ padding: "8px 16px", borderRadius: "6px", background: "rgba(255,255,255,0.1)", color: "white", textDecoration: "none", display: "flex", alignItems: "center", fontSize: "13px" }}>
            Clear
          </a>
        )}
      </form>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", color: "#9ca3af", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Project Name</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Owner Email</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Budget Limit</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Requests (30d)</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Cost (30d)</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projectsWithMetrics.map((project) => (
              <tr key={project.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#f9fafb", fontWeight: 500 }}>
                  {project.name}
                </td>
                <td style={{ padding: "12px 16px", color: "#d1d5db" }}>
                  {project.tenant?.email || "N/A"}
                </td>
                <td style={{ padding: "12px 16px", color: "#9ca3af" }}>
                  ${project.budgetLimit?.toFixed(2) || "∞"} / {project.budgetPeriod.toLowerCase()}
                </td>
                <td style={{ padding: "12px 16px", color: "#9ca3af" }}>
                  {project.requests30d.toLocaleString()}
                </td>
                <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 500 }}>
                  ${project.cost30d.toFixed(4)}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    background: project.status.includes("Healthy") ? "rgba(16, 185, 129, 0.1)" :
                               project.status.includes("Warning") ? "rgba(245, 158, 11, 0.1)" :
                               project.status.includes("Suspended") ? "rgba(107, 114, 128, 0.1)" :
                               "rgba(239, 68, 68, 0.1)",
                    color: project.status.includes("Healthy") ? "#34d399" :
                           project.status.includes("Warning") ? "#fbbf24" :
                           project.status.includes("Suspended") ? "#9ca3af" :
                           "#f87171"
                  }}>
                    {project.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <ProjectActions 
                    projectId={project.id} 
                    isActive={project.isActive} 
                    currentBudget={project.budgetLimit} 
                  />
                </td>
              </tr>
            ))}
            {projectsWithMetrics.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                  No projects found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
