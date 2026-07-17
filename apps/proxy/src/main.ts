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

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Aura Proxy API')
    .setDescription('AI Proxy Middleware - Multi-provider LLM gateway with semantic cache, budget control, and real-time analytics')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Service health checks')
    .addTag('Chat', 'LLM proxy endpoints')
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
