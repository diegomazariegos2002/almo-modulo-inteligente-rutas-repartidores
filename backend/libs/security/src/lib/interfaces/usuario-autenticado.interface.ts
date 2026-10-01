import type { Rol } from '../constants/roles.constant';

/**
 * Identidad que viaja en el JWT y que el guard deja en `request.user`.
 * `@CurrentUser()` la entrega a los controllers.
 */
export interface UsuarioAutenticado {
  /** Id del usuario (claim `sub`). */
  sub: string;
  nombre: string;
  rol: Rol;
  permisos: string[];
  /** Repartidor vinculado; `null` salvo para el rol REPARTIDOR. */
  repartidorId: number | null;
}
