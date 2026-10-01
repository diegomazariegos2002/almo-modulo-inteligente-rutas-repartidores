import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SESION_CONTRACT } from '../../Application/contracts/sesion.contract';
import { Permiso } from '../../Domain/auth.models';

/**
 * Protege una ruta con uno de los permisos del contrato. Va siempre detrás de
 * `authGuard`, que garantiza que hay sesión. El servidor valida el permiso de nuevo
 * en cada petición: este guard solo evita mostrar una pantalla que no va a funcionar.
 */
export const permisoGuard =
  (permiso: Permiso): CanActivateFn =>
  () => {
    const usuario = inject(SESION_CONTRACT).actual()?.usuario;
    return usuario?.tienePermiso(permiso) ? true : inject(Router).createUrlTree(['/sin-permiso']);
  };
