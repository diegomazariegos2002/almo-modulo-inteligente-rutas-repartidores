import type { Err } from './err';
import type { Ok } from './ok';

/**
 * Resultado de una operación que puede fallar.
 *
 * El error es parte de la firma: quien llama está obligado a distinguir ambos
 * casos (`isOk` / `isErr`) antes de usar el valor, en lugar de depender de un
 * `try/catch` que es fácil olvidar.
 */
export type Result<T, E> = Ok<T> | Err<E>;
