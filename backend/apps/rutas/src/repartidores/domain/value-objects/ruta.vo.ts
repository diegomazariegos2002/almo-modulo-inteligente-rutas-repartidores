import type { EstadoOrden } from '../../../shared/domain/value-objects/estado-orden.vo';
import type { EstadoRepartidor } from './estado-repartidor.vo';

/** Parada de una ruta ya ordenada, con las distancias del tramo que lleva hasta ella. */
export interface ParadaRuta {
  readonly secuencia: number;
  readonly folio: string;
  readonly lat: number;
  readonly lng: number;
  readonly pesoKg: number;
  readonly direccion: string | null;
  readonly estado: EstadoOrden;
  /** Desde la parada anterior; en la primera, desde la posición del repartidor. */
  readonly distanciaDesdeAnteriorKm: number;
  readonly distanciaAcumuladaKm: number;
}

export interface RepartidorEnRuta {
  readonly id: number;
  readonly nombre: string;
  readonly estado: EstadoRepartidor;
  readonly lat: number;
  readonly lng: number;
  readonly capacidadKg: number;
  readonly cargaKg: number;
}

/**
 * Ruta calculada de un repartidor. Son datos planos e inmutables a propósito:
 * es exactamente lo que se guarda en caché y lo que se devuelve al cliente.
 */
export interface Ruta {
  readonly repartidor: RepartidorEnRuta;
  readonly paradas: readonly ParadaRuta[];
  readonly totalParadas: number;
  readonly distanciaTotalKm: number;
  /** Instante en que se calculó (ISO 8601): permite ver si la respuesta vino de caché. */
  readonly calculadaEn: string;
}
