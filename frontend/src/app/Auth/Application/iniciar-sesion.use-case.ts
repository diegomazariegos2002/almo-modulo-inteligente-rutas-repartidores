import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Credenciales } from '../Domain/auth.models';
import { AUTH_REPOSITORY } from '../Domain/auth.repository';
import { Sesion } from '../Domain/sesion.entity';
import { SESION_CONTRACT } from './contracts/sesion.contract';

@Injectable()
export class IniciarSesionUseCase {
  private readonly repositorio = inject(AUTH_REPOSITORY);
  private readonly sesion = inject(SESION_CONTRACT);

  /** Autentica al usuario y deja su sesión disponible para el resto de la aplicación. */
  execute(credenciales: Credenciales): Observable<Sesion> {
    return this.repositorio
      .iniciarSesion(credenciales)
      .pipe(tap((sesion) => this.sesion.guardar(sesion)));
  }
}
