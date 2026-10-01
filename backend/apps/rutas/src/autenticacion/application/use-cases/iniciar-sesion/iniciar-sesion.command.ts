import type { Rol } from '@almo/security/constants';

export interface IniciarSesionCommand {
  correo: string;
  password: string;
}

/** Sesión iniciada: el token y los datos del usuario que necesita el cliente. */
export interface Sesion {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: Rol;
    repartidorId: number | null;
    permisos: string[];
  };
}
