import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CerrarSesionUseCase } from './Application/cerrar-sesion.use-case';
import { SESION_CONTRACT } from './Application/contracts/sesion.contract';
import { IniciarSesionUseCase } from './Application/iniciar-sesion.use-case';
import { AUTH_REPOSITORY } from './Domain/auth.repository';
import { SesionStorageAdapter } from './Infrastructure/Adapters/sesion-storage.adapter';
import { AuthHttpRepository } from './Infrastructure/auth-http.repository';

/** Registra el módulo Auth: repositorio de login, almacén de la sesión y casos de uso. */
export const provideAuth = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    { provide: AUTH_REPOSITORY, useClass: AuthHttpRepository },
    { provide: SESION_CONTRACT, useClass: SesionStorageAdapter },
    IniciarSesionUseCase,
    CerrarSesionUseCase,
  ]);
