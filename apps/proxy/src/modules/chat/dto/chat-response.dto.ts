import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageDto {
  @ApiProperty({ description: 'Nombre de jetons (tokens) de la requête', example: 15, type: Number })
  prompt_tokens!: number;

  @ApiProperty({ description: 'Nombre de jetons (tokens) de la complétion', example: 42, type: Number })
  completion_tokens!: number;

  @ApiProperty({ description: 'Nombre total de jetons utilisés', example: 57, type: Number })
  total_tokens!: number;
}

export class ChatMessageResponseDto {
  @ApiProperty({
    description: 'Rôle de l\'expéditeur du message',
    enum: ['system', 'user', 'assistant'],
    example: 'assistant',
    type: String,
  })
  role!: string;

  @ApiProperty({
    description: 'Contenu du message',
    example: 'Bonjour !',
    type: String,
  })
  content!: string;
}

export class ChoiceDto {
  @ApiProperty({ description: 'Indice du choix', example: 0, type: Number })
  index!: number;

  @ApiProperty({
    description: 'Le message généré',
    type: () => ChatMessageResponseDto,
  })
  message!: ChatMessageResponseDto;

  @ApiProperty({
    description: 'Raison de l\'arrêt de la génération',
    example: 'stop',
    type: String,
  })
  finish_reason!: string;
}

/**
 * DTO for chat completion response - OpenAI-compatible format.
 */
export class ChatResponseDto {
  @ApiProperty({ description: 'ID unique de la complétion', example: 'chatcmpl-abc123', type: String })
  id!: string;

  @ApiProperty({ description: 'Type d\'objet', example: 'chat.completion', type: String })
  object!: string;

  @ApiProperty({ description: 'Horodatage Unix de la création', example: 1715000000, type: Number })
  created!: number;

  @ApiProperty({ description: 'Modèle utilisé', example: 'gpt-4o-mini', type: String })
  model!: string;

  @ApiProperty({ description: 'Liste des choix', type: () => [ChoiceDto] })
  choices!: ChoiceDto[];

  @ApiPropertyOptional({ description: 'Utilisation des jetons (tokens)', type: () => UsageDto })
  usage?: UsageDto;

  @ApiPropertyOptional({
    description: 'Coût estimé en USD',
    example: 0.000045,
    type: Number,
  })
  cost_usd?: number;

  @ApiPropertyOptional({
    description: 'Indique si la réponse a été servie depuis le cache sémantique',
    example: false,
    type: Boolean,
  })
  cached?: boolean;

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles du proxy (ex: informations sur le fallback)',
    type: Object,
  })
  metadata?: Record<string, any>;
}
