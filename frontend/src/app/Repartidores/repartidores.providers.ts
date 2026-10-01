import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ListarRepartidoresUseCase } from './Application/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from './Application/obtener-ruta-repartidor.use-case';
import { REPARTIDORES_REPOSITORY } from './Domain/repartidores.repository';
import { RepartidoresHttpRepository } from './Infrastructure/repartidores-http.repository';

/** Registra el módulo Repartidores: su repositorio HTTP y sus casos de uso. */
export const provideRepartidores = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    { provide: REPARTIDORES_REPOSITORY, useClass: RepartidoresHttpRepository },
    ListarRepartidoresUseCase,
    ObtenerRutaRepartidorUseCase,
  ]);
