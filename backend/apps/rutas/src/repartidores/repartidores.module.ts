import { Module } from '@nestjs/common';
import { ListarRepartidoresUseCase } from './application/use-cases/listar-repartidores/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from './application/use-cases/obtener-ruta-repartidor/obtener-ruta-repartidor.use-case';
import { RepartidorRepository } from './domain/ports/outbound/repartidor.repository.port';
import { RutaCache } from './domain/ports/outbound/ruta-cache.port';
import { RepartidoresController } from './infrastructure/inbound/http/repartidores.controller';
import { RedisRutaCacheAdapter } from './infrastructure/outbound/cache/redis-ruta-cache.adapter';
import { PrismaRepartidorRepository } from './infrastructure/outbound/persistence/prisma-repartidor.repository';

@Module({
  controllers: [RepartidoresController],
  providers: [
    { provide: RepartidorRepository, useClass: PrismaRepartidorRepository },
    { provide: RutaCache, useClass: RedisRutaCacheAdapter },
    ObtenerRutaRepartidorUseCase,
    ListarRepartidoresUseCase,
  ],
  // El módulo de órdenes asigna repartidores e invalida sus rutas.
  exports: [RepartidorRepository, RutaCache],
})
export class RepartidoresModule {}
