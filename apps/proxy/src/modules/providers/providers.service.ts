import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMProvider, ProviderName } from '@aura/shared';
import { OpenAIProvider } from '../../providers/openai.provider';
import { AnthropicProvider } from '../../providers/anthropic.provider';
import { MistralProvider } from '../../providers/mistral.provider';
import { GeminiProvider } from '../../providers/gemini.provider';
import { LoggingDecorator } from '../../decorators/logging.decorator';
import { CostTrackerDecorator } from '../../decorators/cost-tracker.decorator';
import { RetryDecorator } from '../../decorators/retry.decorator';

@Injectable()
export class ProvidersService implements OnModuleInit {
  private providers = new Map<string, LLMProvider>();
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    const mistralKey = this.config.get<string>('MISTRAL_API_KEY');
    const googleKey = this.config.get<string>('GOOGLE_API_KEY');

    if (openaiKey) {
      this.register(new OpenAIProvider({ apiKey: openaiKey }));
    }

    if (anthropicKey) {
      this.register(new AnthropicProvider({ apiKey: anthropicKey }));
    }

    if (mistralKey) {
      this.register(new MistralProvider({ apiKey: mistralKey }));
    }

    if (googleKey) {
      this.register(new GeminiProvider({ apiKey: googleKey }));
    }

    if (this.providers.size === 0) {
      this.logger.warn('No providers registered — set API keys in .env');
    } else {
      this.logger.log(`${this.providers.size} provider(s) ready`);
    }
  }

  private register(rawProvider: LLMProvider) {
    // Note: LoggingDecorator expects a logger with info/error/warn methods
    const decorated = new RetryDecorator(
      new CostTrackerDecorator(
        new LoggingDecorator(rawProvider, {
          info: (obj: any, msg: string) => this.logger.log(`${msg} ${JSON.stringify(obj)}`),
          error: (obj: any, msg: string) => this.logger.error(`${msg} ${JSON.stringify(obj)}`),
          warn: (obj: any, msg: string) => this.logger.warn(`${msg} ${JSON.stringify(obj)}`),
        } as any),
        this.prisma.client
      )
    );

    this.providers.set(rawProvider.name, decorated);
    this.logger.log(`Registered provider: ${rawProvider.name} (with decorators)`);
  }

  get(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(
        `Provider "${name}" is not registered. Available: [${[...this.providers.keys()].join(', ')}]`
      );
    }
    return provider;
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  resolveFromModel(model: string): LLMProvider {
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) {
      return this.get('openai');
    }
    if (model.startsWith('claude-')) {
      return this.get('anthropic');
    }
    if (model.startsWith('mistral-') || model.startsWith('codestral')) {
      return this.get('mistral');
    }
    if (model.startsWith('gemini-')) {
      return this.get('google');
    }

    throw new Error(
      `Cannot infer provider from model "${model}". Specify the provider explicitly via x-provider header.`
    );
  }
}
