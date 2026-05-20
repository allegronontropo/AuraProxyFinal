import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { ChatController } from './chat.controller';

function createReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    raw: {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    },
  };
}

describe('ChatController', () => {
  it('normalizes OpenAI request fields before calling the gateway service', async () => {
    const chatService = {
      chat: vi.fn().mockResolvedValue({
        id: 'chatcmpl_test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        content: 'hello',
        usage: {
          promptTokens: 4,
          completionTokens: 2,
          totalTokens: 6,
        },
        cached: false,
        latencyMs: 42,
      }),
    };
    const controller = new ChatController(chatService as any, {} as any);
    const reply = createReply();

    await controller.completions(
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 128,
        top_p: 0.9,
        temperature: 0.2,
      },
      'openai',
      {
        apiKey: {
          keyId: 'key_1',
          permissions: ['chat'],
        },
        project: {
          id: 'project_1',
          tenantId: 'tenant_1',
          budgetLimit: 100,
          budgetPeriod: 'MONTHLY',
          isActive: true,
        },
      },
      reply as any,
    );

    expect(chatService.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: 128,
        topP: 0.9,
        provider: 'openai',
        apiKeyId: 'key_1',
      }),
      expect.objectContaining({ id: 'project_1', tenantId: 'tenant_1' }),
    );
  });

  it('returns an OpenAI-compatible completion envelope', async () => {
    const chatService = {
      chat: vi.fn().mockResolvedValue({
        id: 'chatcmpl_test',
        provider: 'openai',
        model: 'gpt-4o-mini',
        content: 'hello',
        usage: {
          promptTokens: 4,
          completionTokens: 2,
          totalTokens: 6,
        },
        cached: false,
        latencyMs: 42,
      }),
    };
    const controller = new ChatController(chatService as any, {} as any);
    const reply = createReply();

    await controller.completions(
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hello' }],
      },
      undefined as any,
      {
        apiKey: {
          keyId: 'key_1',
          permissions: ['chat'],
        },
        project: {
          id: 'project_1',
          tenantId: 'tenant_1',
          budgetLimit: 100,
          budgetPeriod: 'MONTHLY',
          isActive: true,
        },
      },
      reply as any,
    );

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'chatcmpl_test',
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'hello' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 4,
          completion_tokens: 2,
          total_tokens: 6,
        },
      }),
    );
  });

  it('rejects API keys without chat completion scope', async () => {
    const controller = new ChatController({} as any, {} as any);

    await expect(
      controller.completions(
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say hello' }],
        },
        undefined as any,
        {
          apiKey: {
            keyId: 'key_1',
            permissions: ['models:read'],
          },
          project: {},
        },
        createReply() as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
