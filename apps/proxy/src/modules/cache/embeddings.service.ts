import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private extractor: FeatureExtractionPipeline | null = null;
  public readonly model = 'Xenova/all-MiniLM-L6-v2';

  async onModuleInit() {
    this.logger.log(`Loading local embedding model: ${this.model}`);
    try {
      this.extractor = await pipeline('feature-extraction', this.model, {
        quantized: true,
      });
      this.logger.log('Local embedding model loaded successfully.');
    } catch (error: any) {
      this.logger.error(`Failed to load local embedding model: ${error.message}`);
    }
  }

  /**
   * Generates a 384-dimensional embedding vector locally.
   */
  async generate(text: string): Promise<number[]> {
    if (!this.extractor) {
      this.logger.warn('Embedding model not loaded. Returning zero vector.');
      return new Array(384).fill(0);
    }

    try {
      // Generate the embedding. mean pooling and L2 normalization are standard for STS.
      const output = await this.extractor(text.replace(/\n/g, ' '), { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error: any) {
      throw new Error(`[EmbeddingsService] Failed to generate embedding: ${error.message}`);
    }
  }
}
