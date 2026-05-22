import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import type { Redis } from '@aura/redis';

const VECTOR_INDEX = 'aura:cache:vec';
const VECTOR_PREFIX = 'aura:cache:vec:';
const VECTOR_DIMS = 1536;

type RedisModuleRow = Array<string | number>;
type RedisRawClient = Redis & {
  call(command: string, ...args: (string | Buffer)[]): Promise<unknown>;
};

@Injectable()
export class RedisVectorService implements OnModuleInit {
  private readonly logger = new Logger(RedisVectorService.name);
  private available = false;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private get raw(): RedisRawClient {
    return this.redis.client as RedisRawClient;
  }

  private async checkModuleLoaded(): Promise<boolean> {
    try {
      const modules = await this.raw.call('MODULE', 'LIST') as RedisModuleRow[];
      return modules.some((row) => {
        for (let i = 0; i < row.length; i += 2) {
          if (row[i] === 'name') {
            const value = String(row[i + 1]).toLowerCase();
            return value.includes('search');
          }
        }
        return false;
      });
    } catch {
      return false;
    }
  }

  async onModuleInit() {
    if (!(await this.checkModuleLoaded())) {
      this.logger.warn('RediSearch module not installed — falling back to non-semantic cache');
      return;
    }

    try {
      await this.raw.call(
        'FT.CREATE',
        VECTOR_INDEX, 'ON', 'HASH', 'PREFIX', '1', VECTOR_PREFIX,
        'SCHEMA',
        'project_id', 'TAG',
        'provider', 'TAG',
        'model', 'TAG',
        'prompt_hash', 'TAG',
        'parameters_hash', 'TAG',
        'embedding', 'VECTOR', 'FLAT', '6',
          'TYPE', 'FLOAT32',
          'DIM', String(VECTOR_DIMS),
          'DISTANCE_METRIC', 'COSINE',
      );
      this.available = true;
      this.logger.log('Redis vector index created');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('Index already exists')) {
        this.logger.warn(`Redis vector setup failed: ${msg} — falling back to non-semantic cache`);
        return;
      }
      this.available = true;
      this.logger.log('Redis vector index ready (exists)');
    }
  }

  isEnabled(): boolean {
    return this.available;
  }

  async store(
    key: string,
    projectId: string,
    provider: string,
    model: string,
    promptHash: string,
    parametersHash: string,
    embedding: number[],
    response: unknown,
  ): Promise<void> {
    const fullKey = `${VECTOR_PREFIX}${key}`;
    const buffer = this.vectorToBuffer(embedding);

    await this.redis.client.hset(fullKey,
      'project_id', projectId,
      'provider', provider,
      'model', model,
      'prompt_hash', promptHash,
      'parameters_hash', parametersHash,
      'embedding', buffer,
      'response', JSON.stringify(response),
      'created_at', new Date().toISOString(),
    );
  }

  async search(
    projectId: string,
    provider: string,
    model: string,
    parametersHash: string,
    embedding: number[],
    threshold: number,
  ): Promise<{ response: unknown; similarity: number } | null> {
    const queryVector = this.vectorToBuffer(embedding);

    const results = await this.raw.call(
      'FT.SEARCH',
      VECTOR_INDEX,
      `@project_id:{${this.escapeTag(projectId)}} @provider:{${this.escapeTag(provider)}} @model:{${this.escapeTag(model)}} @parameters_hash:{${this.escapeTag(parametersHash)}}=>[KNN 10 @embedding $vec AS vector_score]`,
      'PARAMS', '2', 'vec', queryVector,
      'RETURN', '4', 'response', 'vector_score', 'prompt_hash', 'created_at',
      'SORTBY', 'vector_score',
      'LIMIT', '0', '10',
      'DIALECT', '2',
    );

    const typedResults = results as unknown as [number, ...any[]];
    if (!typedResults || typedResults[0] === 0) return null;

    for (let i = 1; i < typedResults.length; i += 2) {
      const fields = typedResults[i + 1] as string[];
      const fieldsMap = this.fieldsToMap(fields);
      const rawScore = parseFloat(fieldsMap['vector_score']);
      const distance = isNaN(rawScore) ? 1 : rawScore;
      const similarity = 1 - distance;

      if (distance < threshold && fieldsMap['response']) {
        return { response: JSON.parse(fieldsMap['response']), similarity };
      }
    }

    return null;
  }

  private vectorToBuffer(vector: number[]): Buffer {
    if (vector.length !== VECTOR_DIMS) {
      throw new Error(`Invalid embedding dimension: expected ${VECTOR_DIMS}, got ${vector.length}`);
    }
    const buf = Buffer.alloc(vector.length * 4);
    for (let i = 0; i < vector.length; i++) {
      buf.writeFloatLE(vector[i], i * 4);
    }
    return buf;
  }

  private escapeTag(value: string): string {
    return value.replace(/[{}\-!"()~*?@\\:]/g, '\\$&');
  }

  private fieldsToMap(fields: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      map[fields[i]] = fields[i + 1];
    }
    return map;
  }
}