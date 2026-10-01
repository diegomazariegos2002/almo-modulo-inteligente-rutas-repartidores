import type { Rol } from '@almo/security/constants';

export interface UsuarioProps {
  id: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  rol: Rol;
  /** Repartidor vinculado; `null` salvo para el rol REPARTIDOR. */
  repartidorId: number | null;
  activo: boolean;
}

/** Cuenta de acceso al sistema. */
export class Usuario {
  readonly id: string;
  readonly nombre: string;
  readonly correo: string;
  readonly passwordHash: string;
  readonly rol: Rol;
  readonly repartidorId: number | null;
  readonly activo: boolean;

  constructor(props: UsuarioProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.correo = props.correo;
    this.passwordHash = props.passwordHash;
    this.rol = props.rol;
    this.repartidorId = props.repartidorId;
    this.activo = props.activo;
  }
}
