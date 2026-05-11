/**
 * @aura/shared — Constants
 *
 * Pricing, rate limits, and configuration constants.
 */

// ============================================
// Provider Pricing (USD per 1M tokens)
// ============================================

export const PROVIDER_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },

  // Anthropic
  'claude-4-sonnet': { input: 3, output: 15 },
  'claude-3.5-sonnet': { input: 3, output: 15 },
  'claude-3.5-haiku': { input: 0.8, output: 4 },
  'claude-3-opus': { input: 15, output: 75 },

  // Mistral
  'mistral-large': { input: 2, output: 6 },
  'mistral-medium': { input: 2.7, output: 8.1 },
  'mistral-small': { input: 0.2, output: 0.6 },

  // Google
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
};

// ============================================
// Plan Limits
// ============================================

export const PLAN_LIMITS = {
  FREE: {
    budgetLimit: 10, // $10/month
    rateLimit: 30, // 30 req/min
    maxProjects: 1,
    maxApiKeys: 2,
  },
  PRO: {
    budgetLimit: 500, // $500/month
    rateLimit: 300, // 300 req/min
    maxProjects: 10,
    maxApiKeys: 20,
  },
  ENTERPRISE: {
    budgetLimit: Infinity,
    rateLimit: 3000, // 3000 req/min
    maxProjects: Infinity,
    maxApiKeys: Infinity,
  },
} as const;

// ============================================
// Cache Settings
// ============================================

export const CACHE_DEFAULTS = {
  similarityThreshold: 0.95,
  embeddingDimension: 1536,
  ttlSeconds: 86400 * 7, // 7 days
  maxEntries: 100_000,
} as const;

// ============================================
// Redis Key Prefixes
// ============================================

export const REDIS_KEYS = {
  budget: (projectId: string) => `aura:budget:${projectId}`,
  rateLimit: (apiKeyId: string) => `aura:rate:${apiKeyId}`,
  apiKeyCache: (keyPrefix: string) => `aura:key:${keyPrefix}`,
  health: 'aura:health',
} as const;
