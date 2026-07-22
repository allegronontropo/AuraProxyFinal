import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Pipe de validation globale (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // CORS
  app.enableCors();

  // Stamp every request with its arrival time before any guard or middleware runs.
  // This is the only reliable way to measure true server-side latency (auth + cache + LLM).
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addHook('onRequest', async (request: any) => {
    request.requestStartHrTime = performance.now();
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API Aura Proxy')
    .setDescription('Passerelle middleware IA multi-fournisseurs avec cache sémantique, contrôle de budget et analyses en temps réel')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Entrez votre **Clé API Aura Proxy** (générée depuis le Dashboard). N\'entrez PAS votre clé OpenAI ou Anthropic ici. Le proxy se chargera d\'utiliser les clés des fournisseurs configurées dans votre projet.',
    })
    .addTag('Santé', 'Vérifications de l\'état de santé du service')
    .addTag('Chat', 'Points d\'accès du proxy LLM')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? configService.get<number>('PROXY_PORT') ?? 4000;
  const host = configService.get<string>('PROXY_HOST') ?? '0.0.0.0';
  
  // Bind to PROXY_HOST to allow external connections (e.g., from other Docker containers)
  await app.listen(port, host);
  console.log(`🚀 Aura Proxy running on http://${host}:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}
bootstrap();
