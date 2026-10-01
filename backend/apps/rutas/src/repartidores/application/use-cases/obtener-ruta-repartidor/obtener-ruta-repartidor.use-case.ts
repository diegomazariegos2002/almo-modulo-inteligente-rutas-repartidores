import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { err, isErr, ok, type Result } from '@almo/result';
import { RepartidorNoEncontrado } from '../../../domain/exceptions';
import { RepartidorRepository } from '../../../domain/ports/outbound/repartidor.repository.port';
import { RutaCache } from '../../../domain/ports/outbound/ruta-cache.port';
import { calcularRuta } from '../../../domain/services/calculadora-ruta.service';
import type { Ruta } from '../../../domain/value-objects/ruta.vo';

/**
 * Ruta de un repartidor: sus paradas pendientes en el orden optimizado, con la
 * distancia de cada tramo.
 *
 * El orden ya está guardado (se recalcula al asignar y al entregar); aquí solo
 * se leen las paradas y se miden los tramos. El resultado se guarda en caché y
 * se invalida cuando la ruta cambia.
 */
@Injectable()
export class ObtenerRutaRepartidorUseCase {
  constructor(
    @Inject(RepartidorRepository) private readonly repartidores: RepartidorRepository,
    @Inject(RutaCache) private readonly rutaCache: RutaCache,
  ) {}

  async execute(repartidorId: number): Promise<Result<Ruta, DomainError>> {
    const enCache = await this.rutaCache.get(repartidorId);
    if (enCache) return ok(enCache);

    const repartidor = await this.repartidores.findById(repartidorId);
    if (isErr(repartidor)) return repartidor;
    if (!repartidor.value) return err(new RepartidorNoEncontrado(repartidorId));

    const paradas = await this.repartidores.findParadasPendientes(repartidorId);
    if (isErr(paradas)) return paradas;

    const ruta = calcularRuta(repartidor.value, paradas.value, new Date());
    await this.rutaCache.set(repartidorId, ruta);
    return ok(ruta);
  }
}
