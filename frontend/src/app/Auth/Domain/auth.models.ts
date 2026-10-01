export type Rol = 'CLIENTE' | 'REPARTIDOR' | 'ADMIN';

/** Nombre de cada rol tal como se muestra en pantalla. */
export const DESCRIPCION_ROL: Record<Rol, string> = {
  CLIENTE: 'Cliente',
  REPARTIDOR: 'Repartidor',
  ADMIN: 'Administrador',
};

/** Códigos de permiso que la API entrega en el login (contrato, sección 1). */
export const PERMISOS = {
  ORDEN_CREAR: 'rutas:orden:crear',
  ORDEN_LISTAR: 'rutas:orden:listar',
  ORDEN_CAMBIAR_ESTADO: 'rutas:orden:cambiar-estado',
  RUTA_LEER: 'rutas:ruta:leer',
  REPARTIDOR_LISTAR: 'rutas:repartidor:listar',
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

export interface Credenciales {
  correo: string;
  password: string;
}

/** Cuenta del seed que la pantalla de inicio de sesión ofrece para entrar con un clic. */
export interface CuentaDemo extends Credenciales {
  rol: Rol;
  nombre: string;
}

export interface UsuarioPlain {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  /** Repartidor al que está vinculado el usuario; `null` para clientes y despacho. */
  repartidorId: number | null;
  permisos: readonly string[];
}

/** Forma con la que la sesión se guarda en el navegador. */
export interface SesionPlain {
  accessToken: string;
  /** Fecha ISO 8601 en la que el token deja de ser válido. */
  expiraEn: string;
  usuario: UsuarioPlain;
}
