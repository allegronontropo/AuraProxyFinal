import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { BudgetGuard } from '../../common/guards/budget.guard';
import { RateLimiterGuard } from '../../common/guards/rate-limiter.guard';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import type { FastifyReply } from 'fastify';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('completions')
  @UseGuards(AuthGuard, BudgetGuard, RateLimiterGuard)
  @ApiOperation({ summary: 'OpenAI-compatible chat completions proxy' })
  @ApiResponse({ status: 200, type: ChatResponseDto, description: 'Chat completion response' })
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
    const chatRequest = {
      ...body,
      provider: providerHeader,
      apiKeyId: req.apiKey.keyId,
    };

    if (body.stream) {
      res.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      for await (const chunk of this.chatService.stream(chatRequest as any, req.project)) {
        res.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.raw.write('data: [DONE]\n\n');
      res.raw.end();
      return;
    }

    const response = await this.chatService.chat(chatRequest as any, req.project);
    return res.status(200).send(response);
  }
}
