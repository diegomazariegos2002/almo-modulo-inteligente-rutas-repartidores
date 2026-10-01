import type { DomainError } from '@almo/exceptions';
import { err, ok, type Result } from '@almo/result';
import { RutasPersistenceError } from '../../../domain/exceptions/rutas-persistence.exception';

/**
 * Ejecuta una operación de persistencia y convierte cualquier excepción del
 * motor en un `err(RutasPersistenceError)`.
 *
 * Es la frontera donde se cumple la regla "ningún error de Prisma sale del
 * adaptador": hacia arriba solo viajan `Result` con errores de dominio.
 */
export async function intentar<T>(operacion: string, fn: () => Promise<T>): Promise<Result<T, DomainError>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(new RutasPersistenceError(operacion, error));
  }
}
