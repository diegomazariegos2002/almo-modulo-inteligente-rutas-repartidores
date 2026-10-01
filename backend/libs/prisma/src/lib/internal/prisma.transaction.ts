import { AsyncLocalStorage } from 'node:async_hooks';
import type { TransactionClient, TransactionOptions } from './prisma.types';

/**
 * Transacción activa del flujo asíncrono actual.
 *
 * AsyncLocalStorage la propaga por toda la cadena de llamadas, así los
 * repositorios no necesitan recibir el cliente transaccional como parámetro.
 */
export const txStore = new AsyncLocalStorage<TransactionClient>();

/** Lo mínimo que se necesita de un cliente Prisma para abrir una transacción. */
export interface TransactionStarter {
  $transaction<T>(fn: (tx: TransactionClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
}

export const DEFAULT_TRANSACTION_OPTIONS: Required<TransactionOptions> = {
  maxWait: 10_000,
  timeout: 15_000,
};

/**
 * Ejecuta `fn` dentro de una transacción interactiva.
 *
 * Si ya hay una transacción activa (llamada anidada) se reutiliza: abrir otra
 * usaría una conexión distinta que no vería las filas aún no confirmadas.
 */
export function runInTransaction<T>(prisma: TransactionStarter, fn: () => Promise<T>, options?: TransactionOptions): Promise<T> {
  if (txStore.getStore()) return fn();

  return prisma.$transaction((tx) => txStore.run(tx, fn), {
    maxWait: options?.maxWait ?? DEFAULT_TRANSACTION_OPTIONS.maxWait,
    timeout: options?.timeout ?? DEFAULT_TRANSACTION_OPTIONS.timeout,
  });
}
