import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DomainExceptionFilter, I18nResolver, ResultHttpInterceptor, SimpleI18nResolver } from '@almo/exceptions/nestjs';
import { HealthModule, PrismaHealthModule, RedisHealthModule } from '@almo/health';
import { PrismaModule } from '@almo/prisma';
import { RedisCacheModule } from '@almo/redis';
import { SecurityModule } from '@almo/security';
import { TransactionsModule } from '@almo/transactions';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { envs } from '../config/rutas.envs';
import * as enMessages from '../i18n/en.json';
import * as esMessages from '../i18n/es.json';
import { OrdenesModule } from '../ordenes/ordenes.module';
import { RepartidoresModule } from '../repartidores/repartidores.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    // Infraestructura compartida (módulos globales: se registran una sola vez).
    PrismaModule,
    TransactionsModule,
    RedisCacheModule.register(envs.redis),
    SecurityModule.forRoot({ jwtSecret: envs.jwt.secret, jwtExpiresInSeconds: envs.jwt.expiresInSeconds }),
    HealthModule,
    PrismaHealthModule,
    RedisHealthModule,
    SharedModule,

    // Módulos de negocio.
    AutenticacionModule,
    RepartidoresModule,
    OrdenesModule,
  ],
  providers: [
    { provide: I18nResolver, useValue: new SimpleI18nResolver({ es: esMessages, en: enMessages }) },
    // Todo controller devuelve Result; aquí se convierte en la respuesta HTTP.
    { provide: APP_INTERCEPTOR, useClass: ResultHttpInterceptor },
    // Toda excepción (de dominio o no) sale con la misma forma de error.
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
