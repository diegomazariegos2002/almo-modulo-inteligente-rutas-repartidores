import type { DomainError } from '@almo/exceptions';
import type { Result } from '@almo/result';
import type { Repartidor } from '../../entities/repartidor.entity';
import type { ParadaPendiente } from '../../value-objects/parada.vo';

/**
 * Acceso a los repartidores. Clase abstracta para usarla como token de inyección.
 *
 * Los repartidores se devuelven con su carga y su número de paradas pendientes
 * ya calculados. "No encontrado" es `ok(null)`: el caso de uso decide si es un error.
 */
export abstract class RepartidorRepository {
  abstract findById(id: number): Promise<Result<Repartidor | null, DomainError>>;

  /** Todos, ordenados por id. */
  abstract findAll(): Promise<Result<Repartidor[], DomainError>>;

  /** Solo los que están en estado DISPONIBLE, ordenados por id. */
  abstract findDisponibles(): Promise<Result<Repartidor[], DomainError>>;

  /** Paradas por entregar de un repartidor, en el orden de su ruta. */
  abstract findParadasPendientes(repartidorId: number): Promise<Result<ParadaPendiente[], DomainError>>;

  /** Persiste el estado y la posición actual. */
  abstract guardar(repartidor: Repartidor): Promise<Result<void, DomainError>>;
}
