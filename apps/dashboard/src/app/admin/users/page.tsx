import { prisma } from "@aura/db";
import UserActions from "@/components/admin/UserActions";

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  // Construct Prisma where clause based on filters
  const where: import("@prisma/client").Prisma.UserWhereInput = {};
  if (searchParams.query) {
    where.OR = [
      { email: { contains: searchParams.query as string, mode: "insensitive" } },
      { name: { contains: searchParams.query as string, mode: "insensitive" } }
    ];
  }
  if (searchParams.status === "active") where.isActive = true;
  if (searchParams.status === "suspended") where.isActive = false;

  // Fetch users and their projects with aggregate counts
  const users = await prisma.user.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { projects: true }
      },
      projects: {
        include: {
          _count: {
            select: { apiKeys: true, logs: true }
          }
        }
      }
    }
  });

  // Calculate total requests and total cost per user in code since Prisma doesn't support nested _sum natively easily
  const usersWithMetrics = await Promise.all(
    users.map(async (user) => {
      let totalCost = 0;
      let totalRequests = 0;
      let totalApiKeys = 0;

      for (const project of user.projects) {
        totalRequests += project._count.logs;
        totalApiKeys += project._count.apiKeys;

        // Fetch sum of cost for this project
        const costAgg = await prisma.requestLog.aggregate({
          where: { projectId: project.id },
          _sum: { costUsd: true }
        });
        totalCost += costAgg._sum.costUsd || 0;
      }

      return {
        ...user,
        totalCost,
        totalRequests,
        totalApiKeys
      };
    })
  );

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px 0" }}>Users Directory</h1>
      <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 24px 0" }}>
        Complete list of all users registered on the platform.
      </p>

      {/* Filter Form */}
      <form method="GET" style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input 
          type="text" 
          name="query" 
          placeholder="Search users by name or email..." 
          defaultValue={searchParams.query as string || ""} 
          style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", flex: 1, maxWidth: "300px" }} 
        />
        <select 
          name="status" 
          defaultValue={searchParams.status as string || ""} 
          style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }}
        >
          <option value="" style={{ background: "#0a0a0c" }}>All Statuses</option>
          <option value="active" style={{ background: "#0a0a0c" }}>Active</option>
          <option value="suspended" style={{ background: "#0a0a0c" }}>Suspended</option>
        </select>
        <button 
          type="submit" 
          style={{ padding: "8px 16px", borderRadius: "6px", background: "#8b5cf6", color: "white", fontWeight: 500, border: "none", cursor: "pointer" }}
        >
          Search
        </button>
        {(searchParams.query || searchParams.status) && (
          <a href="/admin/users" style={{ padding: "8px 16px", borderRadius: "6px", background: "rgba(255,255,255,0.1)", color: "white", textDecoration: "none", display: "flex", alignItems: "center", fontSize: "13px" }}>
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
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Name</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Email</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Plan</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Projects</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Requests</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Total Cost</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersWithMetrics.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#f9fafb" }}>{user.name || "N/A"}</td>
                <td style={{ padding: "12px 16px", color: "#d1d5db" }}>{user.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ 
                    background: user.isActive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                    color: user.isActive ? "#10b981" : "#ef4444", 
                    padding: "2px 8px", 
                    borderRadius: 10, 
                    fontSize: 11, 
                    fontWeight: 600 
                  }}>
                    {user.isActive ? "ACTIVE" : "SUSPENDED"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ 
                    background: "rgba(124,58,237,0.1)", 
                    color: "#a78bfa", 
                    padding: "2px 8px", 
                    borderRadius: 10, 
                    fontSize: 11, 
                    fontWeight: 600 
                  }}>
                    {user.plan}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{user._count.projects}</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{user.totalRequests.toLocaleString()}</td>
                <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 500 }}>
                  ${user.totalCost.toFixed(4)}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <UserActions userId={user.id} isActive={user.isActive} />
                </td>
              </tr>
            ))}
            {usersWithMetrics.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                  No users found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
