import { DESCRIPCION_ROL, Permiso, Rol, UsuarioPlain } from './auth.models';

export class Usuario {
  constructor(
    readonly id: string,
    readonly nombre: string,
    readonly correo: string,
    readonly rol: Rol,
    readonly repartidorId: number | null,
    readonly permisos: readonly string[],
  ) {}

  static fromPlain(plain: UsuarioPlain): Usuario {
    return new Usuario(
      plain.id,
      plain.nombre,
      plain.correo,
      plain.rol,
      plain.repartidorId,
      plain.permisos,
    );
  }

  toPlain(): UsuarioPlain {
    return {
      id: this.id,
      nombre: this.nombre,
      correo: this.correo,
      rol: this.rol,
      repartidorId: this.repartidorId,
      permisos: this.permisos,
    };
  }

  /**
   * La interfaz decide por permisos, no por rol: así un cambio en la matriz de
   * permisos del servidor no obliga a tocar el frontend.
   */
  tienePermiso(permiso: Permiso): boolean {
    return this.permisos.includes(permiso);
  }

  get rolDescripcion(): string {
    return DESCRIPCION_ROL[this.rol];
  }
}
