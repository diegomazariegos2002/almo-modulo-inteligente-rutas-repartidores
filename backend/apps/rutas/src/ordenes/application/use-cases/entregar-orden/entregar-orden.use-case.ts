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

export interface OrdenEntregada {
  orden: Orden;
  /** `true` si era la última parada: el repartidor quedó disponible otra vez. */
  rutaCompletada: boolean;
  /** Repartidores cuya ruta cambió (hay que invalidar su caché). */
  repartidoresAfectados: number[];
}

/**
 * El repartidor marca una parada como entregada.
 *
 * - Si aún no había salido a ruta, la salida se registra en este mismo momento
 *   (no se puede entregar sin haber salido).
 * - El repartidor queda ubicado en el destino entregado y su ruta restante se
 *   reordena desde ahí.
 * - Si era su última parada vuelve a DISPONIBLE y se le asignan, en orden de
 *   llegada, las órdenes que estaban en cola.
 */
@Injectable()
export class EntregarOrdenUseCase {
  constructor(
    @Inject(TransactionManagerPort) private readonly txManager: TransactionManagerPort,
    @Inject(DespachoLock) private readonly lock: DespachoLock,
    @Inject(OrdenRepository) private readonly ordenes: OrdenRepository,
    @Inject(RepartidorRepository) private readonly repartidores: RepartidorRepository,
    @Inject(DespachoService) private readonly despacho: DespachoService,
    @Inject(RutaCache) private readonly rutaCache: RutaCache,
  ) {}

  async execute(folio: string): Promise<Result<OrdenEntregada, DomainError>> {
    const ahora = new Date();

    const resultado = await runAtomic(this.txManager, async (): Promise<Result<OrdenEntregada, DomainError>> => {
      const bloqueo = await this.lock.adquirir();
      if (isErr(bloqueo)) return bloqueo;

      const encontrada = await this.ordenes.findByFolio(folio);
      if (isErr(encontrada)) return encontrada;
      let orden = encontrada.value;
      if (!orden) return err(new OrdenNoEncontrada(folio));

      // En cola no tiene repartidor; entregada ya terminó: ninguna se puede entregar.
      if (!orden.repartidor || orden.estado === ESTADO_ORDEN.ENTREGADA) {
        return err(new TransicionEstadoInvalida(orden.folio, orden.estado, ESTADO_ORDEN.ENTREGADA));
      }

      const encontrado = await this.repartidores.findById(orden.repartidor.id);
      if (isErr(encontrado)) return encontrado;
      const repartidor = encontrado.value;
      if (!repartidor) return err(new RepartidorNoEncontrado(orden.repartidor.id));

      // Salida implícita: entrega sin haber marcado "en ruta".
      if (orden.estado === ESTADO_ORDEN.ASIGNADA) {
        const salida = await this.despacho.iniciarRuta(repartidor, ahora);
        if (isErr(salida)) return salida;

        const enRuta = await this.ordenes.findByFolio(orden.folio);
        if (isErr(enRuta)) return enRuta;
        if (!enRuta.value) return err(new OrdenNoEncontrada(orden.folio));
        orden = enRuta.value;
      }

      const entrega = orden.entregar(ahora);
      if (isErr(entrega)) return entrega;
      const guardada = await this.ordenes.guardar(orden);
      if (isErr(guardada)) return guardada;

      repartidor.registrarEntrega(orden, orden.pesoKg);
      const guardado = await this.repartidores.guardar(repartidor);
      if (isErr(guardado)) return guardado;

      const afectados = new Set<number>([repartidor.id]);

      if (repartidor.disponible) {
        // Terminó su ruta: hay un repartidor libre, se atiende la cola.
        const reasignados = await this.despacho.asignarPendientes(ahora);
        if (isErr(reasignados)) return reasignados;
        reasignados.value.forEach((r) => afectados.add(r.id));
      } else {
        const reordenada = await this.despacho.recalcularRuta(repartidor);
        if (isErr(reordenada)) return reordenada;
      }

      return ok({ orden, rutaCompletada: repartidor.disponible, repartidoresAfectados: [...afectados] });
    });

    if (isOk(resultado)) {
      await this.rutaCache.invalidar(...resultado.value.repartidoresAfectados);
    }

    return resultado;
  }
}
