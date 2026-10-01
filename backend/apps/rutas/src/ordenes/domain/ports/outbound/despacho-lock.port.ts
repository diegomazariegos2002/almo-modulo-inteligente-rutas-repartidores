import type { DomainError } from '@almo/exceptions';
import type { Result } from '@almo/result';

/**
 * Exclusión mutua de las decisiones de despacho.
 *
 * Asignar una orden es "leer el estado de los repartidores y decidir": si dos
 * peticiones lo hacen a la vez, ambas ven la misma capacidad libre y la misma
 * ruta, y una pisa a la otra. Este bloqueo las pone en fila.
 *
 * Contrato: se adquiere DENTRO de una transacción, antes de leer nada, y se
 * libera solo cuando la transacción termina (commit o rollback).
 */
export abstract class DespachoLock {
  abstract adquirir(): Promise<Result<void, DomainError>>;
}
