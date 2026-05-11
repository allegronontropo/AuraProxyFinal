import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageDto {
  @ApiProperty({ description: 'Number of prompt tokens', example: 15 })
  prompt_tokens!: number;

  @ApiProperty({ description: 'Number of completion tokens', example: 42 })
  completion_tokens!: number;

  @ApiProperty({ description: 'Total tokens used', example: 57 })
  total_tokens!: number;
}

export class ChoiceDto {
  @ApiProperty({ description: 'Index of the choice', example: 0 })
  index!: number;

  @ApiProperty({
    description: 'The generated message',
    example: { role: 'assistant', content: 'Bonjour !' },
  })
  message!: { role: string; content: string };

  @ApiProperty({
    description: 'Reason the generation stopped',
    example: 'stop',
  })
  finish_reason!: string;
}

/**
 * DTO for chat completion response — OpenAI-compatible format.
 */
export class ChatResponseDto {
  @ApiProperty({ description: 'Unique completion ID', example: 'chatcmpl-abc123' })
  id!: string;

  @ApiProperty({ description: 'Object type', example: 'chat.completion' })
  object!: string;

  @ApiProperty({ description: 'Unix timestamp of creation', example: 1715000000 })
  created!: number;

  @ApiProperty({ description: 'Model used', example: 'gpt-4o-mini' })
  model!: string;

  @ApiProperty({ description: 'List of choices', type: [ChoiceDto] })
  choices!: ChoiceDto[];

  @ApiPropertyOptional({ description: 'Token usage', type: UsageDto })
  usage?: UsageDto;

  @ApiPropertyOptional({
    description: 'Estimated cost in USD',
    example: 0.000045,
  })
  cost_usd?: number;

  @ApiPropertyOptional({
    description: 'Whether response was served from semantic cache',
    example: false,
  })
  cached?: boolean;
}
