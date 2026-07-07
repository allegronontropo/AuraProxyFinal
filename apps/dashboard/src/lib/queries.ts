/**
 * @aura/dashboard — Server-side data access layer
 * All functions are server-only and query Prisma directly.
 */
import { prisma } from "@aura/db";
import { Prisma } from "@prisma/client";

// ─── Workspace / Project ─────────────────────────────────────────────────────

export async function getProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where: { tenantId: userId, isActive: true },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { apiKeys: true, logs: true },
      },
    },
  });
}

export async function getProjectById(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, tenantId: userId, isActive: true },
  });
}

// ─── Overview / Aggregate Stats ──────────────────────────────────────────────

export async function getProjectApiKeys(projectId: string) {
  return prisma.apiKey.findMany({
    where: { projectId },
    select: { id: true, name: true, keyPrefix: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getProjectStats(projectId: string) {
  const [requestStats, cacheHits] = await Promise.all([
    // Total requests, errors, cached count
    prisma.requestLog.aggregate({
      where: { projectId },
      _count: { id: true },
      _sum: { costUsd: true, tokensIn: true, tokensOut: true },
      _avg: { latencyMs: true },
    }),
    prisma.requestLog.count({
      where: { projectId, cached: true },
    }),
  ]);

  // Calculate 30-day timeseries on the fly from RequestLog
  const timeSeriesRaw = await prisma.$queryRawUnsafe<
    { period: Date; totalRequests: bigint; totalCostUsd: number; cacheHits: bigint }[]
  >(`
    SELECT 
      DATE_TRUNC('day', "created_at") as period,
      COUNT(id) as "totalRequests",
      SUM("cost_usd") as "totalCostUsd",
      SUM(CASE WHEN "cached" THEN 1 ELSE 0 END) as "cacheHits"
    FROM "request_logs"
    WHERE "project_id" = $1
      AND "created_at" >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', "created_at")
    ORDER BY period ASC;
  `, projectId);

  const usageStats = timeSeriesRaw.map((row) => ({
    period: row.period,
    totalRequests: Number(row.totalRequests),
    totalCostUsd: Number(row.totalCostUsd ?? 0),
    cacheHits: Number(row.cacheHits),
  }));

  const totalRequests = requestStats._count.id;
  const totalCostUsd = requestStats._sum.costUsd ?? 0;
  const avgLatencyMs = requestStats._avg.latencyMs ?? 0;
  const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

  return {
    totalRequests,
    totalCostUsd,
    avgLatencyMs,
    cacheHitRate,
    usageTimeSeries: usageStats,
  };
}

export async function getProviderBreakdown(projectId: string) {
  const logs = await prisma.requestLog.groupBy({
    by: ["provider"],
    where: { projectId },
    _count: { id: true },
    _sum: { costUsd: true },
    _avg: { latencyMs: true },
    orderBy: { _count: { id: "desc" } },
  });
  return logs;
}

export async function getModelBreakdown(projectId: string) {
  const logs = await prisma.requestLog.groupBy({
    by: ["model", "provider"],
    where: { projectId },
    _count: { id: true },
    _sum: { costUsd: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  return logs;
}

// ─── Request Logs ─────────────────────────────────────────────────────────────

export type LogFilter = {
  provider?: string;
  model?: string;
  statusCode?: number | "error" | "success";
  cached?: boolean;
  search?: string;
  from?: Date;
  to?: Date;
  apiKeyId?: string;
};

export async function getRequestLogs(
  projectId: string,
  page = 1,
  pageSize = 50,
  filters: LogFilter = {},
  sortBy: "createdAt" | "latencyMs" | "costUsd" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  const where: import("@prisma/client").Prisma.RequestLogWhereInput = { projectId };
  if (filters.provider) where.provider = filters.provider;
  if (filters.model) where.model = { contains: filters.model, mode: "insensitive" };
  if (filters.apiKeyId) where.apiKeyId = filters.apiKeyId;
  
  if (filters.statusCode === "error") {
    where.statusCode = { not: 200 };
  } else if (filters.statusCode === "success") {
    where.statusCode = 200;
  } else if (filters.statusCode) {
    where.statusCode = filters.statusCode;
  }

  if (filters.cached !== undefined) where.cached = filters.cached;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  const [logs, total] = await Promise.all([
    prisma.requestLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        apiKey: { select: { name: true, keyPrefix: true } },
      },
    }),
    prisma.requestLog.count({ where }),
  ]);

  return { logs, total, pages: Math.ceil(total / pageSize) };
}

export async function getRecentLogs(projectId: string, limit = 20) {
  return prisma.requestLog.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { apiKey: { select: { name: true, keyPrefix: true } } },
  });
}

// ─── Cache Analytics ──────────────────────────────────────────────────────────

export async function getCacheStats(projectId: string) {
  const [byModel, topEntries, timeSeries] = await Promise.all([
    // Cache breakdown by model
    prisma.semanticCache.groupBy({
      by: ["model", "provider"],
      where: { projectId },
      _count: { id: true },
      _sum: { hitCount: true },
      orderBy: { _sum: { hitCount: "desc" } },
    }),
    // Top cached prompts (highest hit count)
    prisma.semanticCache.findMany({
      where: { projectId },
      orderBy: { hitCount: "desc" },
      take: 10,
    }),
    // Cache hits over time from usage records
    prisma.usageRecord.findMany({
      where: {
        projectId,
        period: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        granularity: "HOURLY",
      },
      orderBy: { period: "asc" },
    }),
  ]);

  return { byModel, topEntries, timeSeries };
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export async function getApiKeys(projectId: string) {
  return prisma.apiKey.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function getBudgetStatus(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { budgetLimit: true, budgetPeriod: true },
  });

  if (!project) return null;

  // Calculate period start
  const now = new Date();
  let periodStart: Date;
  if (project.budgetPeriod === "DAILY") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (project.budgetPeriod === "WEEKLY") {
    const day = now.getDay();
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - day);
    periodStart.setHours(0, 0, 0, 0);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const spent = await prisma.requestLog.aggregate({
    where: { projectId, createdAt: { gte: periodStart } },
    _sum: { costUsd: true },
  });

  const used = spent._sum.costUsd ?? 0;
  return {
    used,
    limit: project.budgetLimit,
    remaining: Math.max(0, project.budgetLimit - used),
    period: project.budgetPeriod,
    percentage: Math.min(100, (used / project.budgetLimit) * 100),
    exceeded: used >= project.budgetLimit,
  };
}

// ─── Alerts (derived from logs) ───────────────────────────────────────────────

export async function getAlertSummary(projectId: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [errorCount, budgetStatus, recentP95] = await Promise.all([
    // Recent error count
    prisma.requestLog.count({
      where: {
        projectId,
        createdAt: { gte: oneHourAgo },
        statusCode: { gte: 400 },
      },
    }),
    getBudgetStatus(projectId),
    // Recent high-latency requests (p95 approximation)
    prisma.requestLog.findMany({
      where: { projectId, createdAt: { gte: oneHourAgo } },
      orderBy: { latencyMs: "desc" },
      take: 5,
      select: { latencyMs: true, provider: true, model: true },
    }),
  ]);

  return { errorCount, budgetStatus, recentP95 };
}

// ─── Settings / User ─────────────────────────────────────────────────────────

export async function getUserWithProjects(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { apiKeys: true } } },
      },
    },
  });
}

// ─── Gateway Insights ────────────────────────────────────────────────────────

export async function getGatewayStatus(projectId: string) {
  const [stats, errorStats] = await Promise.all([
    prisma.requestLog.aggregate({
      where: { projectId },
      _count: { id: true },
      _avg: { latencyMs: true },
    }),
    prisma.requestLog.aggregate({
      where: { projectId, statusCode: { gte: 400 } },
      _count: { id: true },
    })
  ]);

  const totalRequests = stats._count.id;
  const errors = errorStats._count.id;
  const successRate = totalRequests > 0 ? ((totalRequests - errors) / totalRequests) * 100 : 100;

  // Calculate Cache Savings
  const [cacheHits, uncachedAvg] = await Promise.all([
    prisma.requestLog.aggregate({
      where: { projectId, cached: true },
      _count: { id: true },
      _avg: { latencyMs: true },
    }),
    prisma.requestLog.aggregate({
      where: { projectId, cached: false },
      _avg: { latencyMs: true, costUsd: true },
    })
  ]);

  const hits = cacheHits._count.id;
  const avgUncachedCost = uncachedAvg._avg.costUsd ?? 0.0001; // fallback cost
  const avgUncachedLatency = uncachedAvg._avg.latencyMs ?? 500;
  const avgCachedLatency = cacheHits._avg.latencyMs ?? 50;
  
  const costSavedUsd = hits * avgUncachedCost;
  const timeSavedMs = hits * Math.max(0, avgUncachedLatency - avgCachedLatency);

  return {
    successRate,
    avgLatencyMs: stats._avg.latencyMs ?? 0,
    costSavedUsd,
    timeSavedMs,
    totalRequests
  };
}

export async function getGatewayProviderLeaderboard(projectId: string) {
  const [overall, errors] = await Promise.all([
    prisma.requestLog.groupBy({
      by: ["provider"],
      where: { projectId },
      _count: { id: true },
      _avg: { latencyMs: true },
    }),
    prisma.requestLog.groupBy({
      by: ["provider", "statusCode"],
      where: { projectId, statusCode: { gte: 400 } },
      _count: { id: true },
    })
  ]);

  const leaderboard = overall.map((stat) => {
    const providerErrors = errors.filter(e => e.provider === stat.provider);
    const totalErrors = providerErrors.reduce((sum, e) => sum + e._count.id, 0);
    const total = stat._count.id;
    const errorRate = total > 0 ? (totalErrors / total) * 100 : 0;
    const successRate = 100 - errorRate;
    
    return {
      provider: stat.provider,
      totalRequests: total,
      avgLatencyMs: stat._avg.latencyMs ?? 0,
      successRate,
    };
  });

  return leaderboard.sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
}

export async function getGatewayTopModels(projectId: string) {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const models = await prisma.requestLog.groupBy({
    by: ["model", "provider"],
    where: { projectId, createdAt: { gte: last7Days } },
    _count: { id: true },
    _sum: { tokensIn: true, tokensOut: true, costUsd: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });

  // Calculate success rate for each top model
  const modelsWithSuccess = await Promise.all(models.map(async (m) => {
    const errors = await prisma.requestLog.count({
      where: { projectId, model: m.model, provider: m.provider, statusCode: { gte: 400 }, createdAt: { gte: last7Days } }
    });
    const total = m._count.id;
    const successRate = total > 0 ? ((total - errors) / total) * 100 : 100;
    return { ...m, successRate };
  }));

  return modelsWithSuccess;
}

// ─── Usage / Analytics ────────────────────────────────────────────────────────

export async function getUsageByModel(
  projectId: string | null,
  from: Date,
  to: Date
) {
  // Use raw SQL to group by day and model
  const projectCondition = projectId ? Prisma.sql`AND project_id = ${projectId}` : Prisma.empty;
  
  interface UsageRawRow { model: string; provider: string; period: Date; totalRequests: number; tokensIn: number; tokensOut: number; totalTokens: number; totalCostUsd: number; }
  const results = await prisma.$queryRaw<UsageRawRow[]>`
    SELECT 
      model,
      provider,
      DATE_TRUNC('day', created_at) as "period",
      CAST(COUNT(id) AS INTEGER) as "totalRequests",
      CAST(SUM(tokens_in) AS INTEGER) as "tokensIn",
      CAST(SUM(tokens_out) AS INTEGER) as "tokensOut",
      CAST(SUM(tokens_in + tokens_out) AS INTEGER) as "totalTokens",
      CAST(SUM(cost_usd) AS FLOAT) as "totalCostUsd"
    FROM request_logs
    WHERE created_at >= ${from} AND created_at <= ${to}
      ${projectCondition}
    GROUP BY model, provider, DATE_TRUNC('day', created_at)
    ORDER BY "period" ASC;
  `;

  return results.map(r => ({
    model: r.model,
    provider: r.provider,
    period: r.period,
    totalRequests: r.totalRequests || 0,
    tokensIn: r.tokensIn || 0,
    tokensOut: r.tokensOut || 0,
    totalTokens: r.totalTokens || 0,
    totalCostUsd: r.totalCostUsd || 0,
  }));
}

