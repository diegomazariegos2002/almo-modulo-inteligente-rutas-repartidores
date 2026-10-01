import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

/** Idioma de la interfaz. La API devuelve sus mensajes en el idioma de `Accept-Language`. */
const IDIOMA = 'es';

/**
 * Pide a la API los mensajes en el idioma de la interfaz. Sin esto la API usaría el
 * idioma del navegador y un mensaje del servidor podría llegar en inglés a una
 * pantalla en español.
 */
export const idiomaInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'Accept-Language': IDIOMA } }));
};
