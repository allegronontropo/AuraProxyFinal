/**
 * @aura/dashboard — Server-side data access layer
 * All functions are server-only and query Prisma directly.
 */
import { prisma } from "@aura/db";

// ─── Workspace / Project ─────────────────────────────────────────────────────

export async function getProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where: { tenantId: userId },
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
    where: { id: projectId, tenantId: userId },
  });
}

// ─── Overview / Aggregate Stats ──────────────────────────────────────────────

export async function getProjectStats(projectId: string) {
  const [requestStats, usageStats, cacheStats] = await Promise.all([
    // Total requests, errors, cached count
    prisma.requestLog.aggregate({
      where: { projectId },
      _count: { id: true },
      _sum: { costUsd: true, tokensIn: true, tokensOut: true },
      _avg: { latencyMs: true },
    }),
    // Last 30 days usage records
    prisma.usageRecord.findMany({
      where: {
        projectId,
        period: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        granularity: "DAILY",
      },
      orderBy: { period: "asc" },
    }),
    // Cache totals
    prisma.usageRecord.aggregate({
      where: { projectId },
      _sum: { cacheHits: true, cacheMisses: true },
    }),
  ]);

  const totalRequests = requestStats._count.id;
  const totalCostUsd = requestStats._sum.costUsd ?? 0;
  const avgLatencyMs = requestStats._avg.latencyMs ?? 0;
  const cacheHits = cacheStats._sum.cacheHits ?? 0;
  const cacheMisses = cacheStats._sum.cacheMisses ?? 0;
  const totalCacheTotal = cacheHits + cacheMisses;
  const cacheHitRate = totalCacheTotal > 0 ? (cacheHits / totalCacheTotal) * 100 : 0;

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
  statusCode?: number;
  cached?: boolean;
  search?: string;
  from?: Date;
  to?: Date;
};

export async function getRequestLogs(
  projectId: string,
  page = 1,
  pageSize = 50,
  filters: LogFilter = {},
  sortBy: "createdAt" | "latencyMs" | "costUsd" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  const where: any = { projectId };
  if (filters.provider) where.provider = filters.provider;
  if (filters.model) where.model = filters.model;
  if (filters.statusCode) where.statusCode = filters.statusCode;
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
