export type EstadoOrden = 'PENDIENTE_ASIGNACION' | 'ASIGNADA' | 'EN_RUTA' | 'ENTREGADA';

/** Estados a los que un repartidor puede mover una orden. */
export type EstadoDestino = Extract<EstadoOrden, 'EN_RUTA' | 'ENTREGADA'>;

export interface OpcionEstadoOrden {
  codigo: EstadoOrden;
  descripcion: string;
}

/** Los cuatro estados de una orden, en el orden de su ciclo de vida (contrato, sección 3). */
export const ESTADOS_ORDEN: readonly OpcionEstadoOrden[] = [
  { codigo: 'PENDIENTE_ASIGNACION', descripcion: 'Pendiente de Asignación' },
  { codigo: 'ASIGNADA', descripcion: 'Asignada' },
  { codigo: 'EN_RUTA', descripcion: 'En Ruta' },
  { codigo: 'ENTREGADA', descripcion: 'Entregada' },
];

/** Reglas de validación de una orden nueva; son las mismas que aplica el servidor. */
export const LIMITES_ORDEN = {
  latMin: -90,
  latMax: 90,
  lngMin: -180,
  lngMax: 180,
  /** El peso debe ser mayor que 0 y como máximo este valor. */
  pesoMaxKg: 50,
  direccionMaxCaracteres: 120,
} as const;

export interface RepartidorAsignado {
  id: number;
  nombre: string;
}

export interface CambioEstado {
  estado: EstadoOrden;
  estadoDescripcion: string;
  fecha: Date;
}

/** Datos que envía el formulario de creación (`POST /api/ordenes`). */
export interface NuevaOrden {
  lat: number;
  lng: number;
  peso: number;
  direccion?: string;
}

/** Criterios del listado (`GET /api/ordenes`). `estado: null` trae todos los estados. */
export interface FiltroOrdenes {
  estado: EstadoOrden | null;
  page: number;
  limit: number;
}

/** Orden tal como viaja en la API: las fechas llegan como texto ISO 8601. */
export interface OrdenPlain {
  folio: string;
  lat: number;
  lng: number;
  peso: number;
  direccion: string | null;
  estado: EstadoOrden;
  estadoDescripcion: string;
  repartidor: RepartidorAsignado | null;
  secuenciaRuta: number | null;
  creadaEn: string;
  actualizadaEn: string;
  historial: { estado: EstadoOrden; estadoDescripcion: string; fecha: string }[];
}
