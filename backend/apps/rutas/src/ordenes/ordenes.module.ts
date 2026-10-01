import { Module } from '@nestjs/common';
import { RepartidoresModule } from '../repartidores/repartidores.module';
import { DespachoService } from './application/services/despacho.service';
import { CrearOrdenUseCase } from './application/use-cases/crear-orden/crear-orden.use-case';
import { EntregarOrdenUseCase } from './application/use-cases/entregar-orden/entregar-orden.use-case';
import { IniciarRutaUseCase } from './application/use-cases/iniciar-ruta/iniciar-ruta.use-case';
import { ListarOrdenesUseCase } from './application/use-cases/listar-ordenes/listar-ordenes.use-case';
import { ObtenerOrdenUseCase } from './application/use-cases/obtener-orden/obtener-orden.use-case';
import { DespachoLock } from './domain/ports/outbound/despacho-lock.port';
import { OrdenRepository } from './domain/ports/outbound/orden.repository.port';
import { OrdenesController } from './infrastructure/inbound/http/ordenes.controller';
import { PgAdvisoryDespachoLock } from './infrastructure/outbound/persistence/pg-advisory-despacho-lock.adapter';
import { PrismaOrdenRepository } from './infrastructure/outbound/persistence/prisma-orden.repository';

@Module({
  imports: [RepartidoresModule],
  controllers: [OrdenesController],
  providers: [
    { provide: OrdenRepository, useClass: PrismaOrdenRepository },
    { provide: DespachoLock, useClass: PgAdvisoryDespachoLock },
    DespachoService,
    CrearOrdenUseCase,
    ListarOrdenesUseCase,
    ObtenerOrdenUseCase,
    IniciarRutaUseCase,
    EntregarOrdenUseCase,
  ],
})
export class OrdenesModule {}
