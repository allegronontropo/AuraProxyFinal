/**
 * @aura/shared — Core TypeScript Types
 *
 * All interfaces and types shared between proxy, dashboard, and workers.
 */

// ============================================
// LLM Provider Types (Strategy Pattern)
// ============================================

export type ProviderName = 'openai' | 'anthropic' | 'mistral' | 'google';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  provider?: ProviderName;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  apiKeyId?: string; // Internal tracking
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
 * LLM Provider Interface — Strategy Pattern
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
