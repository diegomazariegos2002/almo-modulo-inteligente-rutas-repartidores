import { SesionPlain } from './auth.models';
import { Usuario } from './usuario.entity';

export class Sesion {
  constructor(
    readonly accessToken: string,
    readonly expiraEn: Date,
    readonly usuario: Usuario,
  ) {}

  static fromPlain(plain: SesionPlain): Sesion {
    return new Sesion(
      plain.accessToken,
      new Date(plain.expiraEn),
      Usuario.fromPlain(plain.usuario),
    );
  }

  toPlain(): SesionPlain {
    return {
      accessToken: this.accessToken,
      expiraEn: this.expiraEn.toISOString(),
      usuario: this.usuario.toPlain(),
    };
  }

  /** El token sigue siendo válido en el instante indicado (por defecto, ahora). */
  estaVigente(ahora: Date = new Date()): boolean {
    return this.expiraEn.getTime() > ahora.getTime();
  }
}
