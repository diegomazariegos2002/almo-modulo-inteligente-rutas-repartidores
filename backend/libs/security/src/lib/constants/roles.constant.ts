import { PERMISSIONS } from './permissions.constant';

export const ROLES = {
  CLIENTE: 'CLIENTE',
  REPARTIDOR: 'REPARTIDOR',
  ADMIN: 'ADMIN',
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

const { ORDEN, RUTA, REPARTIDOR } = PERMISSIONS.RUTAS;

/**
 * Qué puede hacer cada rol. Es la única tabla rol → permisos del sistema:
 * los permisos viajan en el token y los guards solo comparan códigos.
 *
 * - CLIENTE: crea órdenes y consulta las suyas.
 * - REPARTIDOR: consulta sus órdenes y su ruta, y cambia el estado de sus paradas.
 * - ADMIN (despacho): solo lectura sobre todas las órdenes, rutas y repartidores.
 */
export const PERMISOS_POR_ROL: Record<Rol, readonly string[]> = {
  CLIENTE: [ORDEN.CREAR, ORDEN.LISTAR],
  REPARTIDOR: [ORDEN.LISTAR, ORDEN.CAMBIAR_ESTADO, RUTA.LEER],
  ADMIN: [ORDEN.LISTAR, RUTA.LEER, REPARTIDOR.LISTAR],
};

export function permisosDeRol(rol: Rol): string[] {
  return [...PERMISOS_POR_ROL[rol]];
}

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && Object.prototype.hasOwnProperty.call(ROLES, valor);
}
