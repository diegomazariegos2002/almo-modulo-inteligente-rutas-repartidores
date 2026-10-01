import type { PrismaClient } from '../generated/client';

/** Cliente que Prisma entrega dentro de una transacción interactiva. */
export type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface TransactionOptions {
  /** Tiempo máximo esperando una conexión libre del pool (ms). */
  maxWait?: number;
  /** Duración máxima de la transacción (ms). */
  timeout?: number;
}
