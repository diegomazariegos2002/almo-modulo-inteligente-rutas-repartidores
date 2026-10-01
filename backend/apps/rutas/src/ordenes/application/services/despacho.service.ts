import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { isErr, ok, type Result } from '@almo/result';
import type { Repartidor } from '../../../repartidores/domain/entities/repartidor.entity';
import { RepartidorRepository } from '../../../repartidores/domain/ports/outbound/repartidor.repository.port';
import { optimizarRuta } from '../../../repartidores/domain/services/optimizador-ruta.service';
import type { Orden } from '../../domain/entities/orden.entity';
import { OrdenRepository } from '../../domain/ports/outbound/orden.repository.port';
import { elegirRepartidor } from '../../domain/services/asignador-ordenes.service';

/**
 * Operaciones de despacho que comparten varios casos de uso: asignar una
 * orden, reordenar una ruta, vaciar la cola y registrar una salida a ruta.
 *
 * Quien las llama ya abrió la transacción y adquirió el bloqueo de despacho;
 * aquí no se abre ni se cierra nada.
 */
@Injectable()
export class DespachoService {
  constructor(
    @Inject(OrdenRepository) private readonly ordenes: OrdenRepository,
    @Inject(RepartidorRepository) private readonly repartidores: RepartidorRepository,
  ) {}

  /**
   * Intenta asignar la orden a uno de los candidatos.
   * Devuelve el repartidor elegido, o `null` si la orden se queda en cola.
   * No reordena la ruta: eso lo decide quien llama (una vez por repartidor).
   */
  async asignar(orden: Orden, candidatos: readonly Repartidor[], ahora: Date): Promise<Result<Repartidor | null, DomainError>> {
    const elegido = elegirRepartidor(orden, orden.pesoKg, candidatos);
    if (!elegido) return ok(null);

    const transicion = orden.asignarA({ id: elegido.id, nombre: elegido.nombre }, ahora);
    if (isErr(transicion)) return transicion;

    const guardada = await this.ordenes.guardar(orden);
    if (isErr(guardada)) return guardada;

    // El candidato ya lleva esta orden: la siguiente decisión lo ve con su carga real.
    elegido.registrarAsignacion(orden.pesoKg);
    return ok(elegido);
  }

  /** Reordena las paradas pendientes del repartidor partiendo de su posición actual. */
  async recalcularRuta(repartidor: Repartidor): Promise<Result<void, DomainError>> {
    const paradas = await this.repartidores.findParadasPendientes(repartidor.id);
    if (isErr(paradas)) return paradas;

    const enOrden = optimizarRuta(repartidor, paradas.value);
    return this.ordenes.actualizarSecuencias(enOrden.map((parada) => parada.folio));
  }

  /**
   * Vacía la cola de órdenes pendientes en orden de llegada (FIFO).
   * Una orden que no le cabe a nadie se salta y sigue esperando: no frena a las
   * que vienen detrás. Devuelve los repartidores cuya ruta cambió.
   */
  async asignarPendientes(ahora: Date): Promise<Result<Repartidor[], DomainError>> {
    const candidatos = await this.repartidores.findDisponibles();
    if (isErr(candidatos)) return candidatos;
    if (candidatos.value.length === 0) return ok([]);

    const pendientes = await this.ordenes.findPendientesDeAsignacion();
    if (isErr(pendientes)) return pendientes;

    const conRutaNueva = new Map<number, Repartidor>();
    for (const orden of pendientes.value) {
      const asignada = await this.asignar(orden, candidatos.value, ahora);
      if (isErr(asignada)) return asignada;
      if (asignada.value) conRutaNueva.set(asignada.value.id, asignada.value);
    }

    for (const repartidor of conRutaNueva.values()) {
      const reordenada = await this.recalcularRuta(repartidor);
      if (isErr(reordenada)) return reordenada;
    }

    return ok([...conRutaNueva.values()]);
  }

  /**
   * Salida a ruta. Es un evento del repartidor, no de un paquete: todas sus
   * órdenes ASIGNADA pasan a EN_RUTA y él deja de recibir órdenes nuevas.
   * Devuelve cuántas paradas salieron.
   */
  async iniciarRuta(repartidor: Repartidor, ahora: Date): Promise<Result<number, DomainError>> {
    const asignadas = await this.ordenes.findAsignadasDe(repartidor.id);
    if (isErr(asignadas)) return asignadas;

    for (const orden of asignadas.value) {
      const transicion = orden.iniciarRuta(ahora);
      if (isErr(transicion)) return transicion;

      const guardada = await this.ordenes.guardar(orden);
      if (isErr(guardada)) return guardada;
    }

    repartidor.salirARuta();
    const guardado = await this.repartidores.guardar(repartidor);
    if (isErr(guardado)) return guardado;

    return ok(asignadas.value.length);
  }
}
