/**
 * Fastify Request Type Augmentation
 *
 * Extends Fastify's Request interface to include the `apiKey` property
 * attached by the auth middleware after successful API key validation.
 */

import type { ApiKeyPayload } from '@aura/shared';

declare module 'fastify' {
  interface FastifyRequest {
    /** Populated by auth middleware after successful API key validation */
    apiKey: ApiKeyPayload;
    /** The raw project record from the database (attached by auth middleware) */
    project: {
      id: string;
      budgetLimit: number;
      budgetPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      isActive: boolean;
    };
  }
}
