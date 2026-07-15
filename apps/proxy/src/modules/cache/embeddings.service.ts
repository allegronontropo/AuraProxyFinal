import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  public readonly model = 'nvidia/llama-nemotron-embed-vl-1b-v2';
  private apiKey: string | undefined;

  async onModuleInit() {
    this.apiKey = process.env.EMBEDDING_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('EMBEDDING_API_KEY is not set. Semantic cache embeddings will fail.');
    }
    this.logger.log(`Initialized remote embedding service using NVIDIA model: ${this.model}`);
  }

  /**
   * Generates a 2048-dimensional embedding vector via NVIDIA API.
   */
  async generate(text: string): Promise<number[]> {
    if (!this.apiKey) {
      this.logger.warn('EMBEDDING_API_KEY not found. Returning zero vector.');
      return new Array(1536).fill(0);
    }

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: [text],
          input_type: 'query',
          dimensions: 1536
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`NVIDIA API error: ${response.status} ${errData}`);
      }

      const data = await response.json();
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid response format from NVIDIA');
      }

      return data.data[0].embedding;
    } catch (error: any) {
      throw new Error(`[EmbeddingsService] Failed to generate embedding: ${error.message}`);
    }
  }
}
