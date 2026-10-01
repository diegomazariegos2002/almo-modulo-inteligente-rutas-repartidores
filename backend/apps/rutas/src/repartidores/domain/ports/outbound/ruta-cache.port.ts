import type { Ruta } from '../../value-objects/ruta.vo';

/**
 * Caché de la ruta calculada de cada repartidor.
 *
 * Es una optimización: nunca devuelve error. Si el caché no está disponible,
 * `get` responde `null` y la ruta se calcula desde la base de datos.
 */
export abstract class RutaCache {
  abstract get(repartidorId: number): Promise<Ruta | null>;

  abstract set(repartidorId: number, ruta: Ruta): Promise<void>;

  /** Se llama cada vez que cambia la ruta: nueva asignación, salida o entrega. */
  abstract invalidar(...repartidorIds: number[]): Promise<void>;
}
