import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { err, isErr, isOk, ok, type Result } from '@almo/result';
import { runAtomic, TransactionManagerPort } from '@almo/transactions';
import { RepartidorNoEncontrado } from '../../../../repartidores/domain/exceptions';
import { RepartidorRepository } from '../../../../repartidores/domain/ports/outbound/repartidor.repository.port';
import { RutaCache } from '../../../../repartidores/domain/ports/outbound/ruta-cache.port';
import { ESTADO_ORDEN } from '../../../../shared/domain/value-objects/estado-orden.vo';
import type { Orden } from '../../../domain/entities/orden.entity';
import { OrdenNoEncontrada, TransicionEstadoInvalida } from '../../../domain/exceptions';
import { DespachoLock } from '../../../domain/ports/outbound/despacho-lock.port';
import { OrdenRepository } from '../../../domain/ports/outbound/orden.repository.port';
import { DespachoService } from '../../services/despacho.service';

export interface RutaIniciada {
  /** La orden por la que se pidió el cambio, ya en EN_RUTA. */
  orden: Orden;
  /** Cuántas paradas salieron a ruta con el repartidor. */
  paradas: number;
}

/**
 * El repartidor sale a ruta (cambio de estado a EN_RUTA).
 *
 * Aunque se pide sobre una orden, la salida es del repartidor: todas sus
 * órdenes ASIGNADA pasan a EN_RUTA y él deja de recibir órdenes nuevas.
 */
@Injectable()
export class IniciarRutaUseCase {
  constructor(
    @Inject(TransactionManagerPort) private readonly txManager: TransactionManagerPort,
    @Inject(DespachoLock) private readonly lock: DespachoLock,
    @Inject(OrdenRepository) private readonly ordenes: OrdenRepository,
    @Inject(RepartidorRepository) private readonly repartidores: RepartidorRepository,
    @Inject(DespachoService) private readonly despacho: DespachoService,
    @Inject(RutaCache) private readonly rutaCache: RutaCache,
  ) {}

  async execute(folio: string): Promise<Result<RutaIniciada, DomainError>> {
    const ahora = new Date();

    const resultado = await runAtomic(this.txManager, async (): Promise<Result<RutaIniciada, DomainError>> => {
      const bloqueo = await this.lock.adquirir();
      if (isErr(bloqueo)) return bloqueo;

      const encontrada = await this.ordenes.findByFolio(folio);
      if (isErr(encontrada)) return encontrada;
      const orden = encontrada.value;
      if (!orden) return err(new OrdenNoEncontrada(folio));

      // Solo sale a ruta lo que está asignado y aún no ha salido.
      if (orden.estado !== ESTADO_ORDEN.ASIGNADA || !orden.repartidor) {
        return err(new TransicionEstadoInvalida(orden.folio, orden.estado, ESTADO_ORDEN.EN_RUTA));
      }

      const repartidor = await this.repartidores.findById(orden.repartidor.id);
      if (isErr(repartidor)) return repartidor;
      if (!repartidor.value) return err(new RepartidorNoEncontrado(orden.repartidor.id));

      const paradas = await this.despacho.iniciarRuta(repartidor.value, ahora);
      if (isErr(paradas)) return paradas;

      const actualizada = await this.ordenes.findByFolio(orden.folio);
      if (isErr(actualizada)) return actualizada;
      if (!actualizada.value) return err(new OrdenNoEncontrada(orden.folio));

      return ok({ orden: actualizada.value, paradas: paradas.value });
    });

    if (isOk(resultado) && resultado.value.orden.repartidor) {
      await this.rutaCache.invalidar(resultado.value.orden.repartidor.id);
    }

    return resultado;
  }
}
