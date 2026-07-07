import { describe, expect, it, vi } from 'vitest';
import { ChatService } from './chat.service';
import type { ChatRequest, ProjectContext } from '@aura/shared';

describe('ChatService cache telemetry', () => {
  it('persists semantic cache metadata when a semantic hit is returned', async () => {
    const requestLogCreate = vi.fn().mockResolvedValue(undefined);
    const budgetRecordCacheEvent = vi.fn().mockResolvedValue(undefined);
    const cacheFind = vi.fn().mockResolvedValue({
      hit: true,
      kind: 'semantic' as const,
      similarityScore: 0.91,
      response: {
        id: 'resp_1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        choices: [{ message: { role: 'assistant', content: 'cached' } }],
      },
    });

    const service = new ChatService(
      { getProviderForProject: vi.fn() } as any,
      { recordCacheEvent: budgetRecordCacheEvent, recordSpend: vi.fn() } as any,
      { find: cacheFind, hashParameters: vi.fn(() => 'hash') } as any,
      { client: { requestLog: { create: requestLogCreate } } } as any,
      { createAlert: vi.fn() } as any,
    );

    const request = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hello' }],
      apiKeyId: 'key_1',
    } as ChatRequest;

    const project = { id: 'project_1', fallbackModels: [] } as ProjectContext;

    const response = await service.chat(request, project);

    expect(response.cached).toBe(true);
    expect(cacheFind).toHaveBeenCalledTimes(1);
    expect(requestLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cached: true,
          metadata: expect.objectContaining({
            cache_hit_type: 'semantic',
            cache_similarity_score: 0.91,
          }),
        }),
      }),
    );
    expect(budgetRecordCacheEvent).toHaveBeenCalledWith('project_1', true);
  });
});
