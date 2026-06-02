import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageDto {
  @ApiProperty({ description: 'Number of prompt tokens', example: 15, type: Number })
  prompt_tokens!: number;

  @ApiProperty({ description: 'Number of completion tokens', example: 42, type: Number })
  completion_tokens!: number;

  @ApiProperty({ description: 'Total tokens used', example: 57, type: Number })
  total_tokens!: number;
}

export class ChatMessageResponseDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['system', 'user', 'assistant'],
    example: 'assistant',
    type: String,
  })
  role!: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Bonjour !',
    type: String,
  })
  content!: string;
}

export class ChoiceDto {
  @ApiProperty({ description: 'Index of the choice', example: 0, type: Number })
  index!: number;

  @ApiProperty({
    description: 'The generated message',
    type: () => ChatMessageResponseDto,
  })
  message!: ChatMessageResponseDto;

  @ApiProperty({
    description: 'Reason the generation stopped',
    example: 'stop',
    type: String,
  })
  finish_reason!: string;
}

/**
 * DTO for chat completion response — OpenAI-compatible format.
 */
export class ChatResponseDto {
  @ApiProperty({ description: 'Unique completion ID', example: 'chatcmpl-abc123', type: String })
  id!: string;

  @ApiProperty({ description: 'Object type', example: 'chat.completion', type: String })
  object!: string;

  @ApiProperty({ description: 'Unix timestamp of creation', example: 1715000000, type: Number })
  created!: number;

  @ApiProperty({ description: 'Model used', example: 'gpt-4o-mini', type: String })
  model!: string;

  @ApiProperty({ description: 'List of choices', type: () => [ChoiceDto] })
  choices!: ChoiceDto[];

  @ApiPropertyOptional({ description: 'Token usage', type: () => UsageDto })
  usage?: UsageDto;

  @ApiPropertyOptional({
    description: 'Estimated cost in USD',
    example: 0.000045,
    type: Number,
  })
  cost_usd?: number;

  @ApiPropertyOptional({
    description: 'Whether response was served from semantic cache',
    example: false,
    type: Boolean,
  })
  cached?: boolean;
}
