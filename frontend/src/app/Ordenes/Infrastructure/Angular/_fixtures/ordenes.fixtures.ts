import { Pagina } from '@shared/Domain/api.models';
import { Orden } from '../../../Domain/orden.entity';
import { OrdenPlain } from '../../../Domain/orden.models';

// Datos de ejemplo para stories y pruebas. Reproducen el seed del backend
// (docs/contrato-api.md, sección 8) con la forma exacta que devuelve la API.

const ORDEN_ENTREGADA_PLAIN: OrdenPlain = {
  folio: 'ORD-000001',
  lat: 14.613,
  lng: -90.554,
  peso: 3,
  direccion: 'Zona 11, Ciudad de Guatemala',
  estado: 'ENTREGADA',
  estadoDescripcion: 'Entregada',
  repartidor: { id: 3, nombre: 'Carla Méndez' },
  secuenciaRuta: null,
  creadaEn: '2026-09-30T13:00:00.000Z',
  actualizadaEn: '2026-09-30T13:45:00.000Z',
  historial: [
    {
      estado: 'PENDIENTE_ASIGNACION',
      estadoDescripcion: 'Pendiente de Asignación',
      fecha: '2026-09-30T13:00:00.000Z',
    },
    { estado: 'ASIGNADA', estadoDescripcion: 'Asignada', fecha: '2026-09-30T13:00:01.000Z' },
    { estado: 'EN_RUTA', estadoDescripcion: 'En Ruta', fecha: '2026-09-30T13:20:00.000Z' },
    { estado: 'ENTREGADA', estadoDescripcion: 'Entregada', fecha: '2026-09-30T13:45:00.000Z' },
  ],
};

export const ORDEN_EN_RUTA_PLAIN: OrdenPlain = {
  folio: 'ORD-000002',
  lat: 14.587,
  lng: -90.546,
  peso: 6,
  direccion: 'Zona 12, Ciudad de Guatemala',
  estado: 'EN_RUTA',
  estadoDescripcion: 'En Ruta',
  repartidor: { id: 3, nombre: 'Carla Méndez' },
  secuenciaRuta: 1,
  creadaEn: '2026-09-30T13:05:00.000Z',
  actualizadaEn: '2026-09-30T13:20:00.000Z',
  historial: [
    {
      estado: 'PENDIENTE_ASIGNACION',
      estadoDescripcion: 'Pendiente de Asignación',
      fecha: '2026-09-30T13:05:00.000Z',
    },
    { estado: 'ASIGNADA', estadoDescripcion: 'Asignada', fecha: '2026-09-30T13:05:01.000Z' },
    { estado: 'EN_RUTA', estadoDescripcion: 'En Ruta', fecha: '2026-09-30T13:20:00.000Z' },
  ],
};

export const ORDEN_ASIGNADA_PLAIN: OrdenPlain = {
  folio: 'ORD-000003',
  lat: 14.6229,
  lng: -90.5155,
  peso: 4.5,
  direccion: 'Zona 4, Ciudad de Guatemala',
  estado: 'ASIGNADA',
  estadoDescripcion: 'Asignada',
  repartidor: { id: 1, nombre: 'Ana López' },
  secuenciaRuta: 1,
  creadaEn: '2026-09-30T15:00:00.000Z',
  actualizadaEn: '2026-09-30T15:00:01.000Z',
  historial: [
    {
      estado: 'PENDIENTE_ASIGNACION',
      estadoDescripcion: 'Pendiente de Asignación',
      fecha: '2026-09-30T15:00:00.000Z',
    },
    { estado: 'ASIGNADA', estadoDescripcion: 'Asignada', fecha: '2026-09-30T15:00:01.000Z' },
  ],
};

const ORDEN_ASIGNADA_SEGUNDA_PLAIN: OrdenPlain = {
  folio: 'ORD-000004',
  lat: 14.634,
  lng: -90.55,
  peso: 3,
  direccion: 'Zona 7, Ciudad de Guatemala',
  estado: 'ASIGNADA',
  estadoDescripcion: 'Asignada',
  repartidor: { id: 1, nombre: 'Ana López' },
  secuenciaRuta: 2,
  creadaEn: '2026-09-30T15:10:00.000Z',
  actualizadaEn: '2026-09-30T15:10:01.000Z',
  historial: [
    {
      estado: 'PENDIENTE_ASIGNACION',
      estadoDescripcion: 'Pendiente de Asignación',
      fecha: '2026-09-30T15:10:00.000Z',
    },
    { estado: 'ASIGNADA', estadoDescripcion: 'Asignada', fecha: '2026-09-30T15:10:01.000Z' },
  ],
};

const ORDEN_ASIGNADA_BRUNO_PLAIN: OrdenPlain = {
  folio: 'ORD-000005',
  lat: 14.587,
  lng: -90.512,
  peso: 8,
  direccion: 'Zona 14, Ciudad de Guatemala',
  estado: 'ASIGNADA',
  estadoDescripcion: 'Asignada',
  repartidor: { id: 2, nombre: 'Bruno Castillo' },
  secuenciaRuta: 1,
  creadaEn: '2026-09-30T15:20:00.000Z',
  actualizadaEn: '2026-09-30T15:20:01.000Z',
  historial: [
    {
      estado: 'PENDIENTE_ASIGNACION',
      estadoDescripcion: 'Pendiente de Asignación',
      fecha: '2026-09-30T15:20:00.000Z',
    },
    { estado: 'ASIGNADA', estadoDescripcion: 'Asignada', fecha: '2026-09-30T15:20:01.000Z' },
  ],
};

/** No está en el seed: es el resultado de crear una orden cuando nadie tiene capacidad. */
export const ORDEN_EN_COLA_PLAIN: OrdenPlain = {
  folio: 'ORD-000006',
  lat: 14.593,
  lng: -90.489,
  peso: 45,
  direccion: null,
  estado: 'PENDIENTE_ASIGNACION',
  estadoDescripcion: 'Pendiente de Asignación',
  repartidor: null,
  secuenciaRuta: null,
  creadaEn: '2026-09-30T15:30:00.000Z',
  actualizadaEn: '2026-09-30T15:30:00.000Z',
  historial: [
    {
      estado: 'PENDIENTE_ASIGNACION',
      estadoDescripcion: 'Pendiente de Asignación',
      fecha: '2026-09-30T15:30:00.000Z',
    },
  ],
};

export const ORDEN_ENTREGADA = Orden.fromPlain(ORDEN_ENTREGADA_PLAIN);
export const ORDEN_EN_RUTA = Orden.fromPlain(ORDEN_EN_RUTA_PLAIN);
export const ORDEN_ASIGNADA = Orden.fromPlain(ORDEN_ASIGNADA_PLAIN);
export const ORDEN_EN_COLA = Orden.fromPlain(ORDEN_EN_COLA_PLAIN);

/** Las cinco órdenes del seed, de la más reciente a la más antigua, como las lista la API. */
export const ORDENES_SEED_PLAIN: OrdenPlain[] = [
  ORDEN_ASIGNADA_BRUNO_PLAIN,
  ORDEN_ASIGNADA_SEGUNDA_PLAIN,
  ORDEN_ASIGNADA_PLAIN,
  ORDEN_EN_RUTA_PLAIN,
  ORDEN_ENTREGADA_PLAIN,
];

export const PAGINA_ORDENES: Pagina<Orden> = {
  data: ORDENES_SEED_PLAIN.map((plain) => Orden.fromPlain(plain)),
  meta: { total: 5, page: 1, limit: 5, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
};

export const PAGINA_ORDENES_VACIA: Pagina<Orden> = {
  data: [],
  meta: { total: 0, page: 1, limit: 5, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
};
