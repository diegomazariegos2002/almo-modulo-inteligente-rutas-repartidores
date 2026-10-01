import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { catchError, throwError } from 'rxjs';
import { SESION_CONTRACT } from '../../Application/contracts/sesion.contract';

/**
 * Agrega el token a las llamadas a la API. Si el servidor responde 401 a una llamada
 * autenticada, el token ya no sirve: se cierra la sesión y se vuelve al inicio de sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SESION_CONTRACT);
  const router = inject(Router);
  const token = sesion.actual()?.accessToken;

  // Sin sesión (el propio login) o fuera de la API, la petición pasa intacta.
  if (!token || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        sesion.limpiar();
        void router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
      }
      return throwError(() => error);
    }),
  );
};
