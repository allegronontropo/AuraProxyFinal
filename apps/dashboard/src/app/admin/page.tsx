import { prisma } from "@aura/db";

export default async function AdminOverviewPage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalProjects,
    totalRequests,
    costAggregate,
    newUsersThisWeek,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.requestLog.count(),
    prisma.requestLog.aggregate({ _sum: { costUsd: true } }),
    prisma.user.count({ where: { created_at: { gte: sevenDaysAgo } } }),
    prisma.user.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        created_at: true,
        _count: {
          select: { projects: true }
        }
      }
    }),
  ]);

  const totalCost = costAggregate._sum.costUsd || 0;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px 0" }}>Platform Overview</h1>
      <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 32px 0" }}>
        Superuser dashboard for platform metrics and activity.
      </p>

      {/* Metrics Strip */}
      <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
        <MetricCard label="Total Users" value={totalUsers.toLocaleString()} />
        <MetricCard label="New Users (7d)" value={newUsersThisWeek.toLocaleString()} />
        <MetricCard label="Total Projects" value={totalProjects.toLocaleString()} />
        <MetricCard label="Total Requests" value={totalRequests.toLocaleString()} />
        <MetricCard label="Total Processed Cost" value={`$${totalCost.toFixed(4)}`} />
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "#e5e7eb" }}>
        Recently Registered Users
      </h2>

      {/* Recent Users Table */}
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
            <tr style={{ background: "rgba(255,255,255,0.03)", color: "#9ca3af" }}>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Name</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Email</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Plan</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Projects</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr key={user.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#f9fafb" }}>{user.name || "N/A"}</td>
                <td style={{ padding: "12px 16px", color: "#d1d5db" }}>{user.email}</td>
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
                <td style={{ padding: "12px 16px", color: "#9ca3af" }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, color: "#f9fafb", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
