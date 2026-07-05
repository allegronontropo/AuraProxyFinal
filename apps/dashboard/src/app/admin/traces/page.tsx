import { prisma } from "@aura/db";

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  if (seconds < 10) return "just now";
  return Math.floor(seconds) + " seconds ago";
}

export default async function AdminTracesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Construct Prisma where clause based on filters
  const where: import("@prisma/client").Prisma.RequestLogWhereInput = {};
  if (params.model) {
    where.model = { contains: params.model as string, mode: "insensitive" };
  }
  if (params.status === "200") {
    where.statusCode = 200;
  } else if (params.status === "error") {
    where.statusCode = { not: 200 };
  }

  // Fetch the latest 200 traces matching the filters
  const traces = await prisma.requestLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      project: { select: { name: true } },
    }
  });

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px 0" }}>System Traces</h1>
      <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 24px 0" }}>
        Deep observability into proxy latencies, caching, and model routing.
      </p>

      {/* Filter Form */}
      <form method="GET" style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input 
          type="text" 
          name="model" 
          placeholder="Filter by model (e.g. gpt-4)" 
          defaultValue={params.model as string || ""} 
          style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", flex: 1, maxWidth: "300px" }} 
        />
        <select 
          name="status" 
          defaultValue={params.status as string || ""} 
          style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }}
        >
          <option value="" style={{ background: "#0a0a0c" }}>All Statuses</option>
          <option value="200" style={{ background: "#0a0a0c" }}>Success (200)</option>
          <option value="error" style={{ background: "#0a0a0c" }}>Errors</option>
        </select>
        <button 
          type="submit" 
          style={{ padding: "8px 16px", borderRadius: "6px", background: "#8b5cf6", color: "white", fontWeight: 500, border: "none", cursor: "pointer" }}
        >
          Filter
        </button>
        {(params.model || params.status) && (
          <a href="/admin/traces" style={{ padding: "8px 16px", borderRadius: "6px", background: "rgba(255,255,255,0.1)", color: "white", textDecoration: "none", display: "flex", alignItems: "center", fontSize: "13px" }}>
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
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Time</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Project</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Model</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Auth Latency</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Cache Latency</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>LLM Latency</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Total Latency</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {traces.map((trace) => {
              // Calculate latency bars widths
              const total = trace.latencyMs || 1; // prevent div by zero
              const authPct = trace.authLatencyMs ? Math.min((trace.authLatencyMs / total) * 100, 100) : 0;
              const cachePct = trace.cacheLatencyMs ? Math.min((trace.cacheLatencyMs / total) * 100, 100) : 0;
              const llmPct = trace.llmLatencyMs ? Math.min((trace.llmLatencyMs / total) * 100, 100) : 0;

              return (
                <tr key={trace.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px 16px", color: "#6b7280", whiteSpace: "nowrap" }}>
                    {timeAgo(trace.createdAt)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#f9fafb" }}>
                    {trace.project?.name || "Unknown"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#d1d5db" }}>{trace.model}</span>
                      {trace.cached && (
                        <span style={{ fontSize: 10, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                          CACHE
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#9ca3af" }}>
                    {trace.authLatencyMs === null ? (
                      <span style={{ color: "#4b5563" }}>N/A</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ minWidth: 40 }}>{trace.authLatencyMs}ms</span>
                        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${authPct}%`, background: "#3b82f6", borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#9ca3af" }}>
                    {trace.cacheLatencyMs === null ? (
                      <span style={{ color: "#4b5563" }}>N/A</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ minWidth: 40 }}>{trace.cacheLatencyMs}ms</span>
                        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${cachePct}%`, background: "#8b5cf6", borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#9ca3af" }}>
                    {trace.llmLatencyMs === null ? (
                      <span style={{ color: "#4b5563" }}>N/A</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ minWidth: 40 }}>{trace.llmLatencyMs}ms</span>
                        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${llmPct}%`, background: "#10b981", borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#f9fafb", fontWeight: 500 }}>
                    {trace.latencyMs}ms
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      color: trace.statusCode === 200 ? "#10b981" : "#ef4444",
                      fontWeight: 600
                    }}>
                      {trace.statusCode}
                    </span>
                  </td>
                </tr>
              );
            })}
            {traces.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                  No traces found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
