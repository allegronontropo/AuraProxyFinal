import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderCredentialsService } from './provider-credentials.service';
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
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProviderCredentialsService) private readonly credentials: ProviderCredentialsService,
  ) {}

  onModuleInit() {
    this.initializeProviders();
  }

  private initializeProviders() {
    if (!this.config) {
      this.logger.error('ConfigService is not defined. Check ProvidersModule imports.');
      return;
    }
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
    const decorated = this.wrapWithDecorators(rawProvider);
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

  /**
   * Returns a provider instance using the project-specific API key when available,
   * falling back to the env-var-initialized shared provider.
   */
  async getProviderForProject(providerName: string, projectId: string): Promise<LLMProvider> {
    const projectApiKey = await this.credentials.resolveApiKey(projectId, providerName);

    if (!projectApiKey) {
      throw new Error(
        `No API key configured for provider "${providerName}". ` +
        `Add a credential in Project Settings or set the environment variable.`
      );
    }

    // If the shared provider already uses this exact key, return it directly (no extra allocation)
    const shared = this.providers.get(providerName);
    if (shared) {
      // For env-var providers the key is already embedded — reuse without re-wrapping
      const envKey = this.credentials['getEnvKey'](providerName);
      if (envKey && envKey === projectApiKey) {
        return shared;
      }
    }

    // Build a fresh provider instance with the project-specific key
    return this.buildProvider(providerName, projectApiKey);
  }

  private buildProvider(name: string, apiKey: string): LLMProvider {
    let raw: LLMProvider;
    switch (name) {
      case 'openai':    raw = new OpenAIProvider({ apiKey }); break;
      case 'anthropic': raw = new AnthropicProvider({ apiKey }); break;
      case 'mistral':   raw = new MistralProvider({ apiKey }); break;
      case 'google':    raw = new GeminiProvider({ apiKey }); break;
      default:
        throw new Error(`Unknown provider "${name}"`);
    }
    return this.wrapWithDecorators(raw);
  }

  private wrapWithDecorators(raw: LLMProvider): LLMProvider {
    return new RetryDecorator(
      new CostTrackerDecorator(
        new LoggingDecorator(raw, {
          info:  (obj: any, msg: string) => this.logger.log(`${msg} ${JSON.stringify(obj)}`),
          error: (obj: any, msg: string) => this.logger.error(`${msg} ${JSON.stringify(obj)}`),
          warn:  (obj: any, msg: string) => this.logger.warn(`${msg} ${JSON.stringify(obj)}`),
        } as any),
        this.prisma.client
      )
    );
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
