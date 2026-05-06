/**
 * @aura/proxy — Environment Configuration
 *
 * Uses Zod for runtime validation of environment variables.
 * Fails fast on startup if any required variable is missing.
 */

import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Resolve .env from monorepo root (walk up until we find it)
const __dirname = dirname(fileURLToPath(import.meta.url));
let envDir = resolve(__dirname, '..');
while (!existsSync(resolve(envDir, '.env')) && envDir !== resolve(envDir, '..')) {
  envDir = resolve(envDir, '..');
}
dotenvConfig({ path: resolve(envDir, '.env') });

const envSchema = z.object({
  // Server
  PROXY_PORT: z.coerce.number().default(3000),
  PROXY_HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // LLM Providers
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),

  // Semantic Cache
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  CACHE_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.95),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
