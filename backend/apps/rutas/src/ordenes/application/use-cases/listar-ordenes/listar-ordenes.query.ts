import type { Solicitante } from '../../../../shared/application/solicitante';
import type { EstadoOrden } from '../../../../shared/domain/value-objects/estado-orden.vo';
import type { Orden } from '../../../domain/entities/orden.entity';

export interface ListarOrdenesQuery {
  solicitante: Solicitante;
  estado?: EstadoOrden;
  page: number;
  limit: number;
}

/** Página de órdenes con lo necesario para armar la paginación (TS puro, sin decoradores). */
export interface ListadoOrdenes {
  ordenes: Orden[];
  total: number;
  page: number;
  limit: number;
}
