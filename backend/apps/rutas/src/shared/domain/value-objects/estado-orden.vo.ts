/*
 * Estados de una orden. Se definen en el dominio como constante + tipo unión
 * (no se importa el enum de Prisma): así el dominio no depende de la persistencia.
 */
export const ESTADO_ORDEN = {
  PENDIENTE_ASIGNACION: 'PENDIENTE_ASIGNACION',
  ASIGNADA: 'ASIGNADA',
  EN_RUTA: 'EN_RUTA',
  ENTREGADA: 'ENTREGADA',
} as const;

export type EstadoOrden = (typeof ESTADO_ORDEN)[keyof typeof ESTADO_ORDEN];

export const ESTADOS_ORDEN: readonly EstadoOrden[] = Object.values(ESTADO_ORDEN);

export const DESCRIPCION_ESTADO_ORDEN: Record<EstadoOrden, string> = {
  PENDIENTE_ASIGNACION: 'Pendiente de Asignación',
  ASIGNADA: 'Asignada',
  EN_RUTA: 'En Ruta',
  ENTREGADA: 'Entregada',
};

/** Máquina de estados: desde cada estado, a cuál se puede pasar. Es lineal y sin retrocesos. */
export const TRANSICIONES_ORDEN: Record<EstadoOrden, readonly EstadoOrden[]> = {
  PENDIENTE_ASIGNACION: [ESTADO_ORDEN.ASIGNADA],
  ASIGNADA: [ESTADO_ORDEN.EN_RUTA],
  EN_RUTA: [ESTADO_ORDEN.ENTREGADA],
  ENTREGADA: [],
};

/** Estados en los que la orden es una parada pendiente en la ruta de un repartidor. */
export const ESTADOS_PARADA_PENDIENTE: readonly EstadoOrden[] = [ESTADO_ORDEN.ASIGNADA, ESTADO_ORDEN.EN_RUTA];

export function esEstadoOrden(valor: unknown): valor is EstadoOrden {
  return typeof valor === 'string' && (ESTADOS_ORDEN as readonly string[]).includes(valor);
}

export function puedeTransicionar(desde: EstadoOrden, hacia: EstadoOrden): boolean {
  return TRANSICIONES_ORDEN[desde].includes(hacia);
}
