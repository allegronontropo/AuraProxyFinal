import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { StreamingService } from './streaming.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { BudgetGuard } from '../../common/guards/budget.guard';
import { RateLimiterGuard } from '../../common/guards/rate-limiter.guard';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import type { FastifyReply } from 'fastify';
import type { ChatRequest, ChatResponse, ProviderName, StreamChunk } from '@aura/shared';

const PROVIDERS: ProviderName[] = ['openai', 'anthropic', 'mistral', 'google'];

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('v1/chat')
export class ChatController {
  constructor(
    @Inject(ChatService) private readonly chatService: ChatService,
    @Inject(StreamingService) private readonly streamingService: StreamingService,
  ) {}

  @Post('completions')
  @UseGuards(AuthGuard, BudgetGuard, RateLimiterGuard)
  @ApiOperation({ summary: 'OpenAI-compatible chat completions proxy' })
  @ApiResponse({ status: 200, type: () => ChatResponseDto, description: 'Chat completion response' })
  @ApiHeader({
    name: 'x-provider',
    description: 'Explicitly specify the LLM provider (optional)',
    required: false,
  })
  async completions(
    @Body() body: ChatRequestDto,
    @Headers('x-provider') providerHeader: string,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    this.assertCanCreateCompletion(req.apiKey?.permissions ?? []);

    const chatRequest: ChatRequest = {
      model: body.model,
      messages: body.messages,
      stream: body.stream,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      topP: body.top_p,
      provider: this.parseProvider(providerHeader),
      apiKeyId: req.apiKey.keyId,
    };

    if (body.stream) {
      res.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      for await (const chunk of this.streamingService.stream(chatRequest, req.project)) {
        res.raw.write(`data: ${JSON.stringify(this.toOpenAIStreamChunk(chunk, body.model))}\n\n`);
      }

      res.raw.write('data: [DONE]\n\n');
      res.raw.end();
      return;
    }

    const response = await this.chatService.chat(chatRequest, req.project);
    return res.status(200).send(this.toOpenAIResponse(response));
  }

  private parseProvider(providerHeader?: string): ProviderName | undefined {
    if (!providerHeader) return undefined;

    const provider = providerHeader.toLowerCase() as ProviderName;
    if (!PROVIDERS.includes(provider)) {
      throw new BadRequestException({
        code: 'INVALID_PROVIDER',
        message: `Unsupported provider "${providerHeader}".`,
        details: { supportedProviders: PROVIDERS },
      });
    }

    return provider;
  }

  private assertCanCreateCompletion(permissions: string[]): void {
    const allowed = ['chat', 'completions', 'chat:write'];
    if (!permissions.some((permission) => allowed.includes(permission))) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_API_KEY_SCOPE',
        message: 'API key does not allow chat completions.',
        details: { requiredAnyOf: allowed },
      });
    }
  }

  private toOpenAIResponse(response: ChatResponse) {
    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens,
      },
      cached: response.cached,
      provider: response.provider,
      latency_ms: response.latencyMs,
    };
  }

  private toOpenAIStreamChunk(chunk: StreamChunk, model: string) {
    return {
      id: chunk.id,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta: chunk.done ? {} : { content: chunk.content },
          finish_reason: chunk.done ? 'stop' : null,
        },
      ],
      ...(chunk.usage && {
        usage: {
          prompt_tokens: chunk.usage.promptTokens,
          completion_tokens: chunk.usage.completionTokens,
          total_tokens: chunk.usage.totalTokens,
        },
      }),
    };
  }
}
