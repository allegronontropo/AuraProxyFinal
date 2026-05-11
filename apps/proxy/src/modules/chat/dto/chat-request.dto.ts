import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single chat message in the OpenAI format.
 */
export class MessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['system', 'user', 'assistant'],
    example: 'user',
  })
  @IsString()
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({
    description: 'Content of the message',
    example: 'Explique-moi le pattern Strategy en NestJS.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

/**
 * DTO for POST /v1/chat/completions — compatible with OpenAI API format.
 */
export class ChatRequestDto {
  @ApiProperty({
    description: 'Model identifier (auto-routes to the correct provider)',
    example: 'gpt-4o-mini',
    examples: {
      openai: { value: 'gpt-4o-mini' },
      anthropic: { value: 'claude-3-5-haiku-latest' },
      mistral: { value: 'mistral-small-latest' },
    },
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    description: 'List of messages in the conversation',
    type: [MessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @ApiPropertyOptional({
    description: 'Enable Server-Sent Events streaming',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({
    description: 'Sampling temperature (0–2)',
    minimum: 0,
    maximum: 2,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of tokens to generate',
    minimum: 1,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_tokens?: number;

  @ApiPropertyOptional({
    description: 'Top-p nucleus sampling',
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  top_p?: number;
}
