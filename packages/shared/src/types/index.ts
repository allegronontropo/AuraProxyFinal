/**
 * @aura/shared - Core TypeScript Types
 *
 * All interfaces and types shared between proxy, dashboard, and workers.
 */

// ============================================
// LLM Provider Types (Strategy Pattern)
// ============================================

export type ProviderName = 'openai' | 'anthropic' | 'mistral' | 'google' | 'groq';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  provider?: ProviderName;
  stream?: boolean;
  
  // Internal fields for tracking
  apiKeyId?: string;
  authLatencyMs?: number;
  cacheLatencyMs?: number;
  metadata?: Record<string, any>;
  /** Stamped by Fastify onRequest hook before any guard. Used for accurate end-to-end proxy latency. */
  requestStartHrTime?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  id: string;
  provider: ProviderName;
  model: string;
  content: string;
  usage: TokenUsage;
  cached: boolean;
  latencyMs: number;
}

export interface StreamChunk {
  id: string;
  content: string;
  done: boolean;
  usage?: TokenUsage;
}

/**
 * LLM Provider Interface - Strategy Pattern
 * Each provider (OpenAI, Anthropic, etc.) implements this interface.
 */
export interface LLMProvider {
  readonly name: ProviderName;
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<StreamChunk>;
  estimateCost(usage: TokenUsage): number;
  listModels(): string[];
}

// ============================================
// API Key & Auth Types
// ============================================

export interface ApiKeyPayload {
  keyId: string;
  projectId: string;
  tenantId: string;
  permissions: string[];
  rateLimit: number;
}

export interface ProjectContext {
  id: string;
  tenantId: string;
  budgetLimit: number;
  budgetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  fallbackModels: string[];
  isActive: boolean;
}

// ============================================
// Budget Types
// ============================================

export interface BudgetStatus {
  projectId: string;
  used: number;
  limit: number;
  remaining: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  exceeded: boolean;
}

// ============================================
// Event System Types (Observer Pattern)
// ============================================

export type EventType =
  | 'request.started'
  | 'request.completed'
  | 'request.failed'
  | 'cache.hit'
  | 'cache.miss'
  | 'budget.warning'
  | 'budget.exceeded'
  | 'error.critical';

export interface EventPayload {
  type: EventType;
  data: Record<string, unknown>;
  timestamp: Date;
}

export type EventHandler = (payload: EventPayload) => void | Promise<void>;

// ============================================
// Health Check
// ============================================

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

// ============================================
// API Error
// ============================================

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface CacheMetrics {
  hits: number;
  exactHits: number;
  semanticHits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  llmCallsAvoided: number;
  embeddingCacheHits: number;
  embeddingCacheMisses: number;
  byModel: Record<string, {
    exactHits: number;
    semanticHits: number;
    misses: number;
    embeddingCacheHits: number;
    embeddingCacheMisses: number;
  }>;
}

// ============================================
// Alerts
// ============================================

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  projectId: string;
  status: AlertStatus;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}
