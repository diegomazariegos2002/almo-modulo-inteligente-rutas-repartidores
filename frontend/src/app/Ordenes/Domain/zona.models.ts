export interface ZonaReferencia {
  nombre: string;
  lat: number;
  lng: number;
}

/**
 * Zonas de referencia del formulario de creación (contrato, sección 7). Sirven para
 * no escribir coordenadas a mano; las coordenadas son aproximadas.
 */
export const ZONAS_REFERENCIA: readonly ZonaReferencia[] = [
  { nombre: 'Zona 1 — Centro Histórico', lat: 14.6417, lng: -90.5133 },
  { nombre: 'Zona 4 — Cuatro Grados Norte', lat: 14.6229, lng: -90.5155 },
  { nombre: 'Zona 7 — Kaminal Juyú', lat: 14.634, lng: -90.55 },
  { nombre: 'Zona 9 — Torre del Reformador', lat: 14.605, lng: -90.522 },
  { nombre: 'Zona 10 — Zona Viva', lat: 14.5995, lng: -90.5069 },
  { nombre: 'Zona 11 — Calzada Roosevelt', lat: 14.613, lng: -90.554 },
  { nombre: 'Zona 12 — Ciudad Universitaria', lat: 14.587, lng: -90.546 },
  { nombre: 'Zona 13 — Aeropuerto', lat: 14.5833, lng: -90.5275 },
  { nombre: 'Zona 14 — Las Américas', lat: 14.587, lng: -90.512 },
  { nombre: 'Zona 15 — Vista Hermosa', lat: 14.593, lng: -90.489 },
  { nombre: 'Zona 16 — Cayalá', lat: 14.609, lng: -90.485 },
  { nombre: 'Mixco — San Cristóbal', lat: 14.6, lng: -90.6 },
  { nombre: 'Villa Nueva — Centro', lat: 14.527, lng: -90.588 },
];
