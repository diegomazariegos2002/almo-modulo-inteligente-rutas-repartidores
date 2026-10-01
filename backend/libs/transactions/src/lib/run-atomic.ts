import { type Err, isErr, type Result } from '@almo/result';
import type { TransactionManagerPort, TransactionOptions } from './transaction-manager.port';

/** Señal interna: aborta la transacción llevando consigo el resultado fallido. */
class Revertir<E> extends Error {
  constructor(readonly resultado: Err<E>) {
    super('Transacción revertida por un Result fallido');
  }
}

/**
 * Ejecuta `fn` en una transacción respetando el patrón Result.
 *
 * Un `err` devuelto no lanza ninguna excepción, así que por sí solo dejaría que
 * la transacción hiciera commit con el trabajo a medias. Aquí un `err` revierte
 * la transacción y ese mismo `err` llega intacto a quien llama.
 */
export async function runAtomic<T, E>(
  txManager: TransactionManagerPort,
  fn: () => Promise<Result<T, E>>,
  opts?: TransactionOptions,
): Promise<Result<T, E>> {
  try {
    return await txManager.run(async () => {
      const resultado = await fn();
      if (isErr(resultado)) throw new Revertir(resultado);
      return resultado;
    }, opts);
  } catch (error) {
    if (error instanceof Revertir) return error.resultado as Err<E>;
    throw error;
  }
}
