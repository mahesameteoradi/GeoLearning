import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip unknown properties from DTOs
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,       // Auto-transform payloads to DTO instances
    }),
  );

  // ─── API Versioning ───────────────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3001'],
    credentials: true,
  });

  // ─── Swagger / OpenAPI ────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GeoLearning Media API')
      .setDescription(
        'Backend API for GeoLearning Media — gamified geography learning platform',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Supabase JWT access token',
        },
        'supabase-jwt',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    console.log(
      `📖 Swagger UI available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
    );
  }

  // ─── Start Server ─────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 GeoLearning Backend running on: http://localhost:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap();
