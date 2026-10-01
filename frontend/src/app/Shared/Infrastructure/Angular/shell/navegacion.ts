import { PERMISOS } from '@auth/Domain/auth.models';
import { Usuario } from '@auth/Domain/usuario.entity';

export interface EnlaceNavegacion {
  etiqueta: string;
  ruta: string;
  icono: string;
  /** Decide si el enlace se ofrece a un usuario, a partir de sus permisos. */
  visiblePara: (usuario: Usuario) => boolean;
}

/**
 * Menú de la aplicación. El orden importa: el primer enlace visible para un usuario
 * es también su pantalla de inicio.
 */
const ENLACES: readonly EnlaceNavegacion[] = [
  {
    etiqueta: 'Nueva orden',
    ruta: '/ordenes/nueva',
    icono: 'add_location_alt',
    visiblePara: (usuario) => usuario.tienePermiso(PERMISOS.ORDEN_CREAR),
  },
  {
    etiqueta: 'Mi ruta',
    ruta: '/mi-ruta',
    icono: 'route',
    // Despacho también puede leer rutas, pero no tiene una propia: no está vinculado
    // a ningún repartidor.
    visiblePara: (usuario) =>
      usuario.tienePermiso(PERMISOS.RUTA_LEER) && usuario.repartidorId !== null,
  },
  {
    etiqueta: 'Despacho',
    ruta: '/despacho',
    icono: 'groups',
    visiblePara: (usuario) => usuario.tienePermiso(PERMISOS.REPARTIDOR_LISTAR),
  },
  {
    etiqueta: 'Órdenes',
    ruta: '/ordenes',
    icono: 'list_alt',
    visiblePara: (usuario) => usuario.tienePermiso(PERMISOS.ORDEN_LISTAR),
  },
];

export function enlacesPara(usuario: Usuario): EnlaceNavegacion[] {
  return ENLACES.filter((enlace) => enlace.visiblePara(usuario));
}
