import type { DomainError } from '@almo/exceptions';
import type { Result } from '@almo/result';
import type { Coordenada } from '../../../../shared/domain/value-objects/coordenada.vo';
import type { EstadoOrden } from '../../../../shared/domain/value-objects/estado-orden.vo';
import type { Peso } from '../../../../shared/domain/value-objects/peso.vo';
import type { Orden } from '../../entities/orden.entity';

/** Datos ya validados para registrar una orden. El folio lo genera la base. */
export interface NuevaOrden {
  clienteId: string;
  destino: Coordenada;
  peso: Peso;
  direccion: string | null;
  creadaEn: Date;
}

export interface FiltroOrdenes {
  estado?: EstadoOrden;
  /** Limita el listado a las órdenes de un cliente. */
  clienteId?: string;
  /** Limita el listado a las órdenes de un repartidor. */
  repartidorId?: number;
  page: number;
  limit: number;
}

export interface PaginaOrdenes {
  ordenes: Orden[];
  total: number;
}

/**
 * Acceso a las órdenes. Clase abstracta para usarla como token de inyección.
 * "No encontrada" es `ok(null)`: el caso de uso decide si es un error.
 */
export abstract class OrdenRepository {
  /** Inserta la orden en estado PENDIENTE_ASIGNACION con su primera entrada de historial. */
  abstract crear(nueva: NuevaOrden): Promise<Result<Orden, DomainError>>;

  abstract findByFolio(folio: string): Promise<Result<Orden | null, DomainError>>;

  /** Cola de órdenes sin repartidor, de la más antigua a la más reciente (FIFO). */
  abstract findPendientesDeAsignacion(): Promise<Result<Orden[], DomainError>>;

  /** Órdenes de un repartidor que aún no han salido a ruta (estado ASIGNADA). */
  abstract findAsignadasDe(repartidorId: number): Promise<Result<Orden[], DomainError>>;

  /** De la más reciente a la más antigua. */
  abstract listar(filtro: FiltroOrdenes): Promise<Result<PaginaOrdenes, DomainError>>;

  /** Persiste estado, repartidor y secuencia, e inserta los cambios de estado pendientes. */
  abstract guardar(orden: Orden): Promise<Result<void, DomainError>>;

  /** Numera 1..n las paradas de un repartidor según el orden de folios recibido. */
  abstract actualizarSecuencias(foliosEnOrden: readonly string[]): Promise<Result<void, DomainError>>;
}
