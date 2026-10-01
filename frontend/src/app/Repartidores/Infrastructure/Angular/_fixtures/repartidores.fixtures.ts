import { Repartidor } from '../../../Domain/repartidor.entity';
import { RepartidorPlain, RutaPlain } from '../../../Domain/repartidor.models';
import { Ruta } from '../../../Domain/ruta.entity';

// Datos de ejemplo para stories y pruebas. Reproducen el seed del backend
// (docs/contrato-api.md, sección 8) con la forma exacta que devuelve la API. Las
// distancias son Haversine entre las zonas de referencia, redondeadas a 2 decimales.

const ANA: RepartidorPlain = {
  id: 1,
  nombre: 'Ana López',
  estado: 'DISPONIBLE',
  estadoDescripcion: 'Disponible',
  lat: 14.6417,
  lng: -90.5133,
  capacidadKg: 50,
  cargaKg: 7.5,
};

const BRUNO: RepartidorPlain = {
  id: 2,
  nombre: 'Bruno Castillo',
  estado: 'DISPONIBLE',
  estadoDescripcion: 'Disponible',
  lat: 14.5995,
  lng: -90.5069,
  capacidadKg: 60,
  cargaKg: 8,
};

// Carla ya entregó ORD-000001 en la Zona 11: esa es su posición actual.
const CARLA: RepartidorPlain = {
  id: 3,
  nombre: 'Carla Méndez',
  estado: 'EN_RUTA',
  estadoDescripcion: 'En ruta',
  lat: 14.613,
  lng: -90.554,
  capacidadKg: 40,
  cargaKg: 6,
};

/** Respuesta de `GET /api/repartidores` con el seed recién cargado. */
export const REPARTIDORES_PLAIN: RepartidorPlain[] = [
  { ...ANA, paradasPendientes: 2 },
  { ...BRUNO, paradasPendientes: 1 },
  { ...CARLA, paradasPendientes: 1 },
];

/** Ana aún no sale: dos paradas asignadas. */
export const RUTA_ANA_PLAIN: RutaPlain = {
  repartidor: ANA,
  paradas: [
    {
      secuencia: 1,
      folio: 'ORD-000003',
      lat: 14.6229,
      lng: -90.5155,
      peso: 4.5,
      direccion: 'Zona 4, Ciudad de Guatemala',
      estado: 'ASIGNADA',
      estadoDescripcion: 'Asignada',
      distanciaDesdeAnteriorKm: 2.1,
      distanciaAcumuladaKm: 2.1,
    },
    {
      secuencia: 2,
      folio: 'ORD-000004',
      lat: 14.634,
      lng: -90.55,
      peso: 3,
      direccion: 'Zona 7, Ciudad de Guatemala',
      estado: 'ASIGNADA',
      estadoDescripcion: 'Asignada',
      distanciaDesdeAnteriorKm: 3.91,
      distanciaAcumuladaKm: 6.02,
    },
  ],
  totalParadas: 2,
  distanciaTotalKm: 6.02,
  calculadaEn: '2026-09-30T15:10:01.000Z',
};

/** Bruno tampoco ha salido: una parada asignada. */
const RUTA_BRUNO_PLAIN: RutaPlain = {
  repartidor: BRUNO,
  paradas: [
    {
      secuencia: 1,
      folio: 'ORD-000005',
      lat: 14.587,
      lng: -90.512,
      peso: 8,
      direccion: 'Zona 14, Ciudad de Guatemala',
      estado: 'ASIGNADA',
      estadoDescripcion: 'Asignada',
      distanciaDesdeAnteriorKm: 1.49,
      distanciaAcumuladaKm: 1.49,
    },
  ],
  totalParadas: 1,
  distanciaTotalKm: 1.49,
  calculadaEn: '2026-09-30T15:20:01.000Z',
};

/** Carla ya salió a ruta: una sola parada, en ruta. */
export const RUTA_CARLA_PLAIN: RutaPlain = {
  repartidor: CARLA,
  paradas: [
    {
      secuencia: 1,
      folio: 'ORD-000002',
      lat: 14.587,
      lng: -90.546,
      peso: 6,
      direccion: 'Zona 12, Ciudad de Guatemala',
      estado: 'EN_RUTA',
      estadoDescripcion: 'En Ruta',
      distanciaDesdeAnteriorKm: 3.02,
      distanciaAcumuladaKm: 3.02,
    },
  ],
  totalParadas: 1,
  distanciaTotalKm: 3.02,
  calculadaEn: '2026-09-30T13:45:00.000Z',
};

/** Una ruta sin paradas es una respuesta válida de la API. */
export const RUTA_VACIA_PLAIN: RutaPlain = {
  repartidor: { ...ANA, cargaKg: 0 },
  paradas: [],
  totalParadas: 0,
  distanciaTotalKm: 0,
  calculadaEn: '2026-09-30T16:00:00.000Z',
};

/** No está en el seed: una ruta larga, ya en curso, para ver la lista y el mapa con varias paradas. */
export const RUTA_LARGA_PLAIN: RutaPlain = {
  repartidor: { ...BRUNO, estado: 'EN_RUTA', estadoDescripcion: 'En ruta', cargaKg: 33.5 },
  paradas: [
    {
      secuencia: 1,
      folio: 'ORD-000005',
      lat: 14.587,
      lng: -90.512,
      peso: 8,
      direccion: 'Zona 14, Ciudad de Guatemala',
      estado: 'EN_RUTA',
      estadoDescripcion: 'En Ruta',
      distanciaDesdeAnteriorKm: 1.49,
      distanciaAcumuladaKm: 1.49,
    },
    {
      secuencia: 2,
      folio: 'ORD-000007',
      lat: 14.5833,
      lng: -90.5275,
      peso: 5,
      direccion: 'Zona 13, Ciudad de Guatemala',
      estado: 'EN_RUTA',
      estadoDescripcion: 'En Ruta',
      distanciaDesdeAnteriorKm: 1.72,
      distanciaAcumuladaKm: 3.21,
    },
    {
      secuencia: 3,
      folio: 'ORD-000008',
      lat: 14.587,
      lng: -90.546,
      peso: 12.5,
      direccion: null,
      estado: 'EN_RUTA',
      estadoDescripcion: 'En Ruta',
      distanciaDesdeAnteriorKm: 2.03,
      distanciaAcumuladaKm: 5.24,
    },
    {
      secuencia: 4,
      folio: 'ORD-000009',
      lat: 14.613,
      lng: -90.554,
      peso: 2,
      direccion: 'Zona 11, Ciudad de Guatemala',
      estado: 'EN_RUTA',
      estadoDescripcion: 'En Ruta',
      distanciaDesdeAnteriorKm: 3.02,
      distanciaAcumuladaKm: 8.26,
    },
    {
      secuencia: 5,
      folio: 'ORD-000010',
      lat: 14.634,
      lng: -90.55,
      peso: 6,
      direccion: 'Zona 7, Ciudad de Guatemala',
      estado: 'EN_RUTA',
      estadoDescripcion: 'En Ruta',
      distanciaDesdeAnteriorKm: 2.37,
      distanciaAcumuladaKm: 10.63,
    },
  ],
  totalParadas: 5,
  distanciaTotalKm: 10.63,
  calculadaEn: '2026-09-30T16:30:00.000Z',
};

export const REPARTIDORES = REPARTIDORES_PLAIN.map((plain) => Repartidor.fromPlain(plain));
export const [REPARTIDOR_ANA, REPARTIDOR_BRUNO, REPARTIDOR_CARLA] = REPARTIDORES;

export const RUTA_ANA = Ruta.fromPlain(RUTA_ANA_PLAIN);
export const RUTA_BRUNO = Ruta.fromPlain(RUTA_BRUNO_PLAIN);
export const RUTA_CARLA = Ruta.fromPlain(RUTA_CARLA_PLAIN);
export const RUTA_VACIA = Ruta.fromPlain(RUTA_VACIA_PLAIN);
export const RUTA_LARGA = Ruta.fromPlain(RUTA_LARGA_PLAIN);
