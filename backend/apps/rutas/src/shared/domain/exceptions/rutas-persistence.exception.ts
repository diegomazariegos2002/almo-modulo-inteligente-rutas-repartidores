import { PersistenceError } from '@almo/exceptions';

/**
 * Fallo de almacenamiento del servicio. Los adaptadores de persistencia atrapan
 * el error del motor y lo envuelven aquí: el detalle técnico queda en `metadata`
 * (para el log) y al cliente solo le llega un mensaje genérico.
 */
export class RutasPersistenceError extends PersistenceError {
  readonly code = 'RUTAS.PERSISTENCE_ERROR' as const;

  constructor(operacion: string, causa: unknown) {
    super({
      messageKey: 'errors.rutas.persistence_error',
      message: `Error de persistencia en ${operacion}`,
      metadata: { operacion, causa: causa instanceof Error ? causa.message : String(causa) },
    });
  }
}
