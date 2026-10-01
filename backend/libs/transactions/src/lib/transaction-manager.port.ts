export interface TransactionOptions {
  /** Tiempo máximo esperando una conexión libre (ms). */
  maxWait?: number;
  /** Duración máxima de la transacción (ms). */
  timeout?: number;
}

/**
 * Unidad de trabajo atómica para la capa de aplicación.
 *
 * El caso de uso pide "ejecuta esto como un todo" sin saber qué motor hay
 * detrás. El callback no recibe ningún cliente: los repositorios toman la
 * transacción activa por su cuenta, así sus firmas no cambian.
 *
 * Regla: dentro de `run()` solo van escrituras a la base. Las llamadas de red
 * (caché, servicios externos) van fuera, para no retener bloqueos mientras responden.
 */
export abstract class TransactionManagerPort {
  abstract run<T>(fn: () => Promise<T>, opts?: TransactionOptions): Promise<T>;
}
