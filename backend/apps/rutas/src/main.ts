import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { validationExceptionFactory } from '@almo/exceptions/nestjs';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { envs } from './config/rutas.envs';
import { setupSwagger } from './config/swagger';

const GLOBAL_PREFIX = 'api';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.use(compression());
  app.disable('x-powered-by');

  // El frontend llama a /api por el mismo origen (proxy); CORS solo abre los orígenes configurados.
  app.enableCors({
    origin: envs.allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  app.setGlobalPrefix(GLOBAL_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta las propiedades que el DTO no declara y convierte al tipo declarado.
      whitelist: true,
      transform: true,
      // Los errores salen con la forma estándar y un detalle por campo.
      exceptionFactory: validationExceptionFactory,
    }),
  );

  setupSwagger(app);
  app.enableShutdownHooks();

  await app.listen(envs.port);
  Logger.log(`API disponible en http://localhost:${envs.port}/${GLOBAL_PREFIX}`, 'Bootstrap');
  if (envs.enableSwagger) Logger.log(`Swagger en http://localhost:${envs.port}/${GLOBAL_PREFIX}/docs`, 'Bootstrap');
}

void bootstrap();
