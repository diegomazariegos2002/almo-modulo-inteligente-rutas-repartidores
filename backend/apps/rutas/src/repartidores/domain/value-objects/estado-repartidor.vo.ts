/*
 * Estados de un repartidor (constante + tipo unión; no se importa el enum de Prisma).
 *
 *  DISPONIBLE  Está en espera: puede recibir órdenes mientras tenga capacidad.
 *  EN_RUTA     Salió a entregar: no recibe órdenes nuevas hasta terminar su ruta.
 */
export const ESTADO_REPARTIDOR = {
  DISPONIBLE: 'DISPONIBLE',
  EN_RUTA: 'EN_RUTA',
} as const;

export type EstadoRepartidor = (typeof ESTADO_REPARTIDOR)[keyof typeof ESTADO_REPARTIDOR];

export const DESCRIPCION_ESTADO_REPARTIDOR: Record<EstadoRepartidor, string> = {
  DISPONIBLE: 'Disponible',
  EN_RUTA: 'En ruta',
};
