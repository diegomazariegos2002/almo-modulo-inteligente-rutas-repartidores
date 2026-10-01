import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CambiarEstadoOrdenUseCase } from './Application/cambiar-estado-orden.use-case';
import { CrearOrdenUseCase } from './Application/crear-orden.use-case';
import { ListarOrdenesUseCase } from './Application/listar-ordenes.use-case';
import { ORDENES_REPOSITORY } from './Domain/ordenes.repository';
import { OrdenesHttpRepository } from './Infrastructure/ordenes-http.repository';

/** Registra el módulo Órdenes: su repositorio HTTP y sus casos de uso. */
export const provideOrdenes = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    { provide: ORDENES_REPOSITORY, useClass: OrdenesHttpRepository },
    CrearOrdenUseCase,
    ListarOrdenesUseCase,
    CambiarEstadoOrdenUseCase,
  ]);
