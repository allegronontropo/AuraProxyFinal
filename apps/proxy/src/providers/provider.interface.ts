/**
 * Provider Interface & Configuration
 *
 * Re-exports the LLMProvider interface from @aura/shared and defines
 * provider-specific configuration types used during initialization.
 */

export type { LLMProvider } from '@aura/shared';

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}
