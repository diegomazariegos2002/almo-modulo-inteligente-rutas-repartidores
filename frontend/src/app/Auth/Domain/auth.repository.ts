import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Credenciales } from './auth.models';
import { Sesion } from './sesion.entity';

export interface AuthRepository {
  /** Valida las credenciales y devuelve la sesión (token y usuario con sus permisos). */
  iniciarSesion(credenciales: Credenciales): Observable<Sesion>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
