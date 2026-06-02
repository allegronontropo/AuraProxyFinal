import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private openai!: OpenAI;
  private readonly model = 'text-embedding-3-small';

  constructor(@Inject(ConfigService) private configService: ConfigService) {}

  onModuleInit() {
    if (!this.configService) {
      console.error('[EmbeddingsService] ConfigService is UNDEFINED at onModuleInit');
      return;
    }
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('********************************************************************************');
      console.error('[EmbeddingsService] WARNING: OPENAI_API_KEY is missing.');
      console.error('Exact match cache will work, but SEMANTIC search will be disabled.');
      console.error('********************************************************************************');
      return;
    }
    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Generates an embedding vector for the given text using OpenAI.
   * @param text The input text to embed.
   * @returns A promise that resolves to an array of numbers (the embedding).
   */
  async generate(text: string): Promise<number[]> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey || !this.openai) {
      // Fallback for testing/demo purposes if key is missing
      // This ensures we can still perform the database query even if semantic results are empty
      console.warn('[EmbeddingsService] Semantic search requested but OpenAI is not configured. Returning zero vector.');
      return new Array(1536).fill(0);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text.replace(/\n/g, ' '), // Recommended preprocessing
      });

      return response.data[0].embedding;
    } catch (error: any) {
      throw new Error(`[EmbeddingsService] Failed to generate embedding: ${error.message}`);
    }
  }
}
