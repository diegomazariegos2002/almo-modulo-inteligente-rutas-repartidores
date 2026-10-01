/**
 * Permisos del sistema. Convención: `{dominio}:{recurso}:{accion}`.
 * Los controllers declaran el permiso que exigen con `@Permission(...)`.
 */
export const PERMISSIONS = {
  RUTAS: {
    ORDEN: {
      CREAR: 'rutas:orden:crear',
      LISTAR: 'rutas:orden:listar',
      CAMBIAR_ESTADO: 'rutas:orden:cambiar-estado',
    },
    RUTA: {
      LEER: 'rutas:ruta:leer',
    },
    REPARTIDOR: {
      LISTAR: 'rutas:repartidor:listar',
    },
  },
} as const;
