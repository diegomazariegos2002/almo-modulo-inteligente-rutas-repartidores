import { type ErrorDetail } from '@almo/exceptions';
import type { PuntoGeografico } from '../services/distancia-haversine.service';

export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;

export const MENSAJE_LAT_INVALIDA = 'La latitud debe ser un número entre -90 y 90.';
export const MENSAJE_LNG_INVALIDA = 'La longitud debe ser un número entre -180 y 180.';

const enRango = (valor: unknown, min: number, max: number): valor is number =>
  typeof valor === 'number' && Number.isFinite(valor) && valor >= min && valor <= max;

/** Punto geográfico válido. Inmutable: una coordenada no cambia, se reemplaza. */
export class Coordenada implements PuntoGeografico {
  private constructor(
    readonly lat: number,
    readonly lng: number,
  ) {}

  /** Errores de validación de un par lat/lng; vacío si es válido. */
  static validar(lat: unknown, lng: unknown): ErrorDetail[] {
    const errores: ErrorDetail[] = [];
    if (!enRango(lat, LAT_MIN, LAT_MAX)) errores.push({ campo: 'lat', mensaje: MENSAJE_LAT_INVALIDA });
    if (!enRango(lng, LNG_MIN, LNG_MAX)) errores.push({ campo: 'lng', mensaje: MENSAJE_LNG_INVALIDA });
    return errores;
  }

  /** Crea la coordenada; lanza si es inválida. Validar antes con `Coordenada.validar`. */
  static de(lat: number, lng: number): Coordenada {
    const errores = Coordenada.validar(lat, lng);
    if (errores.length > 0) throw new RangeError(errores.map((e) => e.mensaje).join(' '));
    return new Coordenada(lat, lng);
  }

  equals(otra: PuntoGeografico): boolean {
    return this.lat === otra.lat && this.lng === otra.lng;
  }
}
