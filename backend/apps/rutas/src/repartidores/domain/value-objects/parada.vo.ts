import type { PuntoGeografico } from '../../../shared/domain/services/distancia-haversine.service';
import type { EstadoOrden } from '../../../shared/domain/value-objects/estado-orden.vo';

/**
 * Una orden vista desde la ruta de un repartidor: una parada todavía por entregar.
 * Es un modelo de lectura; la orden como agregado vive en el módulo de órdenes.
 */
export interface ParadaPendiente extends PuntoGeografico {
  readonly folio: string;
  readonly pesoKg: number;
  readonly direccion: string | null;
  readonly estado: EstadoOrden;
}
