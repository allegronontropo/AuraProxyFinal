/**
 * @aura/dashboard - Server-side data access layer
 * All functions are server-only and query Prisma directly.
 */
import { prisma } from "@aura/db";
import { Prisma } from "@prisma/client";

function estimateJsonBytes(value: unknown) {
  if (value == null) return 0;
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

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
  const [requestLogs, cacheEntriesForSavings] = await Promise.all([
    prisma.requestLog.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        provider: true,
        model: true,
        latencyMs: true,
        statusCode: true,
        cached: true,
        metadata: true,
        costUsd: true,
        createdAt: true,
      },
    }),
    prisma.semanticCache.findMany({
      where: { projectId },
      select: { hitCount: true, response: true },
    }),
  ]);

  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const buckets = Array.from({ length: 24 }, (_, index) => ({
    period: new Date(now.getTime() - (23 - index) * 60 * 60 * 1000),
    cacheHits: 0,
    cacheMisses: 0,
    exactHits: 0,
    semanticHits: 0,
  }));

  let exactHits = 0;
  let semanticHits = 0;
  let misses = 0;
  let totalSimilarityScore = 0;
  let semanticSimilarityCount = 0;
  
  let totalExactLatency = 0;
  let totalSemanticLatency = 0;
  let totalMissLatency = 0;
  let totalMissCost = 0;

  const recentEvents = requestLogs
    .filter((log) => log.cached)
    .slice(0, 12)
    .map((log) => {
    const metadata = (log.metadata ?? {}) as Record<string, unknown>;
    const cacheHitType =
      typeof metadata.cache_hit_type === "string"
        ? metadata.cache_hit_type
        : log.cached
          ? "exact"
          : "miss";
    const similarityScore =
      typeof metadata.cache_similarity_score === "number"
        ? metadata.cache_similarity_score
        : null;

    return {
      id: log.id,
      createdAt: log.createdAt,
      provider: log.provider,
      model: log.model,
      latencyMs: log.latencyMs,
      statusCode: log.statusCode,
      cached: log.cached,
      cacheHitType,
      similarityScore,
    };
  });

  for (const log of requestLogs) {
    if (log.createdAt < start) continue;

    const ageHours = Math.floor((now.getTime() - log.createdAt.getTime()) / (60 * 60 * 1000));
    const bucketIndex = Math.max(0, Math.min(23, 23 - ageHours));

    if (log.cached) {
      buckets[bucketIndex].cacheHits += 1;
      const hitType = ((log.metadata as Record<string, unknown> | null)?.cache_hit_type as string | undefined) ?? "exact";
      if (hitType === "semantic") {
        buckets[bucketIndex].semanticHits += 1;
        semanticHits += 1;
        if (log.latencyMs != null) totalSemanticLatency += log.latencyMs;
        const score = (log.metadata as Record<string, unknown> | null)?.cache_similarity_score;
        if (typeof score === "number") {
          totalSimilarityScore += score;
          semanticSimilarityCount += 1;
        }
      } else {
        buckets[bucketIndex].exactHits += 1;
        exactHits += 1;
        if (log.latencyMs != null) totalExactLatency += log.latencyMs;
      }
    } else {
      buckets[bucketIndex].cacheMisses += 1;
      misses += 1;
      if (log.latencyMs != null) totalMissLatency += log.latencyMs;
      if (log.costUsd != null) totalMissCost += Number(log.costUsd);
    }
  }

  const estimatedBandwidthSavedBytes = cacheEntriesForSavings.reduce((sum, entry) => {
    return sum + estimateJsonBytes(entry.response) * Math.max(entry.hitCount, 0);
  }, 0);

  const avgSemanticSimilarity = semanticSimilarityCount > 0 ? totalSimilarityScore / semanticSimilarityCount : 0;
  
  const avgExactLatency = exactHits > 0 ? totalExactLatency / exactHits : 0;
  const avgSemanticLatency = semanticHits > 0 ? totalSemanticLatency / semanticHits : 0;
  const avgMissLatency = misses > 0 ? totalMissLatency / misses : 0;
  const avgMissCost = misses > 0 ? totalMissCost / misses : 0;

  return {
    timeSeries: buckets,
    exactHits,
    semanticHits,
    misses,
    avgSemanticSimilarity,
    avgExactLatency,
    avgSemanticLatency,
    avgMissLatency,
    avgMissCost,
    recentEvents,
    estimatedBandwidthSavedBytes,
  };
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
  const [cacheHits, uncachedAvg, cacheEntriesForSavings] = await Promise.all([
    prisma.requestLog.aggregate({
      where: { projectId, cached: true },
      _count: { id: true },
      _avg: { latencyMs: true },
    }),
    prisma.requestLog.aggregate({
      where: { projectId, cached: false },
      _avg: { latencyMs: true, costUsd: true },
    }),
    prisma.semanticCache.findMany({
      where: { projectId },
      select: { hitCount: true, response: true },
    }),
  ]);

  const hits = cacheHits._count.id;
  const cacheHitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;
  const avgUncachedCost = uncachedAvg._avg.costUsd ?? 0.0001; // fallback cost
  const avgUncachedLatency = uncachedAvg._avg.latencyMs ?? 500;
  const avgCachedLatency = cacheHits._avg.latencyMs ?? 50;
  
  const costSavedUsd = hits * avgUncachedCost;
  const timeSavedMs = hits * Math.max(0, avgUncachedLatency - avgCachedLatency);
  const estimatedBandwidthSavedBytes = cacheEntriesForSavings.reduce((sum, entry) => {
    return sum + estimateJsonBytes(entry.response) * Math.max(entry.hitCount, 0);
  }, 0);

  return {
    successRate,
    avgLatencyMs: stats._avg.latencyMs ?? 0,
    cacheHits: hits,
    cacheHitRate,
    costSavedUsd,
    timeSavedMs,
    estimatedBandwidthSavedBytes,
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

