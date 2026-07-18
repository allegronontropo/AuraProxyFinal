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
    description: 'Rôle de l\'expéditeur du message',
    enum: ['system', 'user', 'assistant'],
    example: 'user',
  })
  @IsString()
  @IsIn(['system', 'user', 'assistant'])
  role!: 'system' | 'user' | 'assistant';

  @ApiProperty({
    description: 'Contenu du message',
    example: 'Explique-moi le pattern Strategy en NestJS.',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

/**
 * DTO for POST /v1/chat/completions - compatible with OpenAI API format.
 */
export class ChatRequestDto {
  @ApiProperty({
    description: 'Identifiant du modèle (redirection automatique vers le bon fournisseur)',
    example: 'gpt-4o-mini',
    examples: {
      openai: { value: 'gpt-4o-mini' },
      anthropic: { value: 'claude-3-5-haiku-latest' },
      mistral: { value: 'mistral-small-latest' },
    },
  })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({
    description: 'Liste des messages de la conversation',
    type: [MessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages!: MessageDto[];

  @ApiPropertyOptional({
    description: 'Activer le streaming via Server-Sent Events',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({
    description: 'Température d\'échantillonnage (0–2)',
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
    description: 'Nombre maximum de jetons (tokens) à générer',
    minimum: 1,
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_tokens?: number;

  @ApiPropertyOptional({
    description: 'Échantillonnage de noyau Top-p',
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  top_p?: number;
}
