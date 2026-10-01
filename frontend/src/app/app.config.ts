import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAuth } from '@auth/auth.providers';
import { authInterceptor } from '@auth/Infrastructure/Interceptors/auth.interceptor';
import { provideOrdenes } from '@ordenes/ordenes.providers';
import { provideRepartidores } from '@repartidores/repartidores.providers';
import { errorInterceptor } from '@shared/Infrastructure/Interceptors/error.interceptor';
import { idiomaInterceptor } from '@shared/Infrastructure/Interceptors/idioma.interceptor';
import { provideShared } from '@shared/shared.providers';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // El orden importa. Una respuesta recorre los interceptores en sentido inverso:
    // primero `authInterceptor`, que necesita ver el 401 original, y al final
    // `errorInterceptor`, que traduce el fallo al mensaje que verá el usuario.
    provideHttpClient(withInterceptors([idiomaInterceptor, errorInterceptor, authInterceptor])),
    provideShared(),
    provideAuth(),
    provideOrdenes(),
    provideRepartidores(),
  ],
};
