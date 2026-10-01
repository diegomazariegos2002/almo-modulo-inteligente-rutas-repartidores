import { type DynamicModule, Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

export interface SecurityModuleOptions {
  /** Secreto HMAC con el que se firman y verifican los tokens (HS256). */
  jwtSecret: string;
  jwtExpiresInSeconds: number;
}

export const SECURITY_OPTIONS = Symbol('SECURITY_OPTIONS');

/**
 * Registra el JWT y los dos guards globales, en este orden:
 * primero autenticación (`JwtAuthGuard`), después permiso (`PermissionsGuard`).
 * Exporta `JwtModule` para que el servicio de autenticación pueda emitir tokens.
 */
@Global()
@Module({})
export class SecurityModule {
  static forRoot(options: SecurityModuleOptions): DynamicModule {
    return {
      module: SecurityModule,
      imports: [
        JwtModule.register({
          secret: options.jwtSecret,
          signOptions: { algorithm: 'HS256', expiresIn: options.jwtExpiresInSeconds },
          verifyOptions: { algorithms: ['HS256'] },
        }),
      ],
      providers: [
        { provide: SECURITY_OPTIONS, useValue: options },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
      exports: [JwtModule, SECURITY_OPTIONS],
    };
  }
}
