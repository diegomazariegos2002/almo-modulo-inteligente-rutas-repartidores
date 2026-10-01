import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LOGGER_CONTRACT } from '../../Application/contracts/logger.contract';
import { mapearErrorHttp } from '../Http/error-api.mapper';

/**
 * Traduce cualquier fallo HTTP a `ErrorAplicacion`. Gracias a él, repositorios,
 * casos de uso y componentes reciben siempre un mensaje listo para mostrarse.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LOGGER_CONTRACT);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const errorAplicacion = mapearErrorHttp(error);
      // Los 4xx son respuestas esperadas del negocio; solo se registran los fallos
      // de red o del servidor, que son los que hay que diagnosticar.
      if (error.status === 0 || error.status >= 500) {
        logger.error(`Falló ${req.method} ${req.url} (HTTP ${error.status})`, error.message);
      }
      return throwError(() => errorAplicacion);
    }),
  );
};
