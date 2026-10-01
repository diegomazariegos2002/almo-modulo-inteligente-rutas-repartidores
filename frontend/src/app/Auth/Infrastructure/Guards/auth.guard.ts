import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SESION_CONTRACT } from '../../Application/contracts/sesion.contract';

/** Solo deja pasar con una sesión vigente; si no la hay, envía al inicio de sesión. */
export const authGuard: CanActivateFn = () => {
  const sesion = inject(SESION_CONTRACT);
  const router = inject(Router);
  const actual = sesion.actual();

  if (actual?.estaVigente()) {
    return true;
  }

  if (actual) {
    // Había sesión pero el token venció mientras la pestaña seguía abierta.
    sesion.limpiar();
    return router.createUrlTree(['/login'], { queryParams: { sesion: 'expirada' } });
  }

  return router.createUrlTree(['/login']);
};
