import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

export async function bootstrapApp(app: INestApplication) {
  // ─── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── API Versioning ───────────────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
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
  }

  return app;
}

// ─── VERCEL SERVERLESS HANDLER ─────────────────────────────────────────────
let cachedServer: express.Express;

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    const server = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    await bootstrapApp(app);
    await app.init();
    cachedServer = server;
  }
  return cachedServer(req, res);
}

// ─── LOCAL DEVELOPMENT SERVER ──────────────────────────────────────────────
// Only start the HTTP server if we are NOT running on Vercel
if (!process.env.VERCEL) {
  async function bootstrapLocal() {
    const app = await NestFactory.create(AppModule);
    await bootstrapApp(app);
    
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    
    console.log(`🚀 GeoLearning Backend running on: http://localhost:${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  }
  
  bootstrapLocal();
}
