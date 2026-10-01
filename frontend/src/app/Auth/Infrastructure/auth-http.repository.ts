import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';
import { Credenciales, UsuarioPlain } from '../Domain/auth.models';
import { AuthRepository } from '../Domain/auth.repository';
import { Sesion } from '../Domain/sesion.entity';

/** Campos que se usan de la respuesta de `POST /api/auth/login` (contrato, sección 6). */
interface RespuestaLogin {
  accessToken: string;
  /** Vigencia del token en segundos. */
  expiresIn: number;
  usuario: UsuarioPlain;
}

@Injectable()
export class AuthHttpRepository implements AuthRepository {
  private readonly http = inject(HttpClient);

  iniciarSesion(credenciales: Credenciales): Observable<Sesion> {
    return this.http
      .post<RespuestaLogin>(`${environment.apiBaseUrl}/auth/login`, credenciales)
      .pipe(
        map(({ accessToken, expiresIn, usuario }) =>
          // La API informa la vigencia como duración; se guarda como fecha para
          // poder comprobarla más tarde, incluso después de recargar la página.
          Sesion.fromPlain({
            accessToken,
            expiraEn: new Date(Date.now() + expiresIn * 1000).toISOString(),
            usuario,
          }),
        ),
      );
  }
}
