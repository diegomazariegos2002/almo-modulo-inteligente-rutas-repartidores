import { Global, Module } from '@nestjs/common';
import { ResourceOwnershipPort } from '@almo/security';
import { RutasResourceOwnershipAdapter } from './infrastructure/ownership/rutas-resource-ownership.adapter';

/** Piezas transversales del servicio que usan varios módulos de negocio. */
@Global()
@Module({
  providers: [{ provide: ResourceOwnershipPort, useClass: RutasResourceOwnershipAdapter }],
  exports: [ResourceOwnershipPort],
})
export class SharedModule {}
