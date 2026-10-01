import type { Rol } from '@almo/security/constants';

/**
 * Quién hace la petición, tal como lo necesita la capa de aplicación:
 * sin tipos de HTTP ni del token. El controller lo construye desde la sesión.
 */
export interface Solicitante {
  usuarioId: string;
  rol: Rol;
  /** Repartidor vinculado; `null` salvo para el rol REPARTIDOR. */
  repartidorId: number | null;
}
