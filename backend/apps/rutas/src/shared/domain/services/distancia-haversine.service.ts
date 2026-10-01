/** Cualquier cosa con latitud y longitud en grados decimales. */
export interface PuntoGeografico {
  readonly lat: number;
  readonly lng: number;
}

/** Radio medio de la Tierra (IUGG), en kilómetros. */
export const RADIO_TIERRA_KM = 6371.0088;

const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

/**
 * Distancia en línea recta sobre la superficie terrestre (fórmula de Haversine).
 *
 *   h = sin²(Δlat/2) + cos(lat₁)·cos(lat₂)·sin²(Δlng/2)
 *   d = 2·R·asin(√h)
 *
 * Trata a la Tierra como una esfera: el error frente al elipsoide real es menor
 * al 0.5 %, despreciable a escala de ciudad. No considera calles ni tráfico.
 */
export function distanciaHaversineKm(origen: PuntoGeografico, destino: PuntoGeografico): number {
  const dLat = aRadianes(destino.lat - origen.lat);
  const dLng = aRadianes(destino.lng - origen.lng);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aRadianes(origen.lat)) * Math.cos(aRadianes(destino.lat)) * Math.sin(dLng / 2) ** 2;

  // El redondeo de punto flotante puede dejar h apenas por encima de 1 en puntos antipodales.
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Redondea a 2 decimales (10 metros): la precisión con la que se muestra una distancia. */
export function redondearKm(km: number): number {
  return Math.round(km * 100) / 100;
}
