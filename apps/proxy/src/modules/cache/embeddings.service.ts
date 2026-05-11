import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private openai!: OpenAI;
  private model!: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.model = this.configService.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small');
  }

  /**
   * Generates an embedding vector for the given text.
   * @param text The input text to embed.
   * @returns A promise that resolves to an array of numbers (the embedding).
   */
  async generate(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text.replace(/\n/g, ' '), // Recommended preprocessing
    });

    return response.data[0].embedding;
  }
}
