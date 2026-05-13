/**
 * Provider Factory — Singleton Registry + Decorator Composition
 *
 * Manages LLM provider instances. Providers are registered on startup
 * based on available API keys in the environment configuration.
 * Each provider is wrapped in the Decorator chain:
 *   RetryDecorator → CostTrackerDecorator → LoggingDecorator → RawProvider
 */

import type { LLMProvider } from '@aura/shared';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { MistralProvider } from './mistral.provider';
import { GeminiProvider } from './gemini.provider';
import { config } from '../config/index';
import { LoggingDecorator } from '../decorators/logging.decorator';
import { CostTrackerDecorator } from '../decorators/cost-tracker.decorator';
import { RetryDecorator } from '../decorators/retry.decorator';
import { prisma } from '@aura/db';

// Minimal console-based logger compatible with pino interface
const defaultLogger = {
  info: (obj: Record<string, unknown>, msg: string) => console.log(`[INFO] ${msg}`, obj),
  error: (obj: Record<string, unknown>, msg: string) => console.error(`[ERROR] ${msg}`, obj),
  warn: (obj: Record<string, unknown>, msg: string) => console.warn(`[WARN] ${msg}`, obj),
};

class ProviderFactory {
  private providers = new Map<string, LLMProvider>();
  private logger = defaultLogger;

  /**
   * Set the logger (called once Fastify is initialized to use pino).
   */
  setLogger(logger: typeof defaultLogger): void {
    this.logger = logger;
  }

  /**
   * Register a raw provider and wrap it with the decorator chain.
   */
  register(rawProvider: LLMProvider): void {
    const decorated = new RetryDecorator(
      new CostTrackerDecorator(
        new LoggingDecorator(rawProvider, this.logger),
        prisma
      )
    );

    this.providers.set(rawProvider.name, decorated);
    console.log(`[ProviderFactory] Registered provider: ${rawProvider.name} (with decorators)`);
  }

  get(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(
        `Provider "${name}" is not registered. Available: [${[...this.providers.keys()].join(', ')}]`
      );
    }
    return provider;
  }

  getAll(): Map<string, LLMProvider> {
    return this.providers;
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Resolve provider from a model name.
   * e.g. "gpt-4o" → openai, "claude-3.5-sonnet" → anthropic
   */
  resolveFromModel(model: string): LLMProvider {
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) {
      return this.get('openai');
    }
    if (model.startsWith('claude-')) {
      return this.get('anthropic');
    }
    if (model.startsWith('mistral-') || model.startsWith('codestral')) {
      return this.get('mistral');
    }
    if (model.startsWith('gemini-')) {
      return this.get('google');
    }

    throw new Error(
      `Cannot infer provider from model "${model}". Specify the provider explicitly via x-provider header.`
    );
  }
}

// Singleton instance
export const providerFactory = new ProviderFactory();

/**
 * Initialize providers based on available API keys.
 * Called once during server startup.
 */
export function initializeProviders(): void {
  if (config.OPENAI_API_KEY) {
    providerFactory.register(
      new OpenAIProvider({
        apiKey: config.OPENAI_API_KEY,
      })
    );
  }

  if (config.ANTHROPIC_API_KEY) {
    providerFactory.register(
      new AnthropicProvider({
        apiKey: config.ANTHROPIC_API_KEY,
      })
    );
  }

  if (config.MISTRAL_API_KEY) {
    providerFactory.register(
      new MistralProvider({
        apiKey: config.MISTRAL_API_KEY,
      })
    );
  }

  if (config.GOOGLE_API_KEY) {
    providerFactory.register(
      new GeminiProvider({
        apiKey: config.GOOGLE_API_KEY,
      })
    );
  }

  const count = providerFactory.getAll().size;
  if (count === 0) {
    console.warn('[ProviderFactory] ⚠️  No providers registered — set API keys in .env');
  } else {
    console.log(`[ProviderFactory] ✅ ${count} provider(s) ready`);
  }
}
