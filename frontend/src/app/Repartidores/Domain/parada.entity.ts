import { EstadoOrden } from '@ordenes/Domain/orden.models';
import { ParadaPlain } from './repartidor.models';

export class Parada {
  constructor(
    /** Posición en la ruta optimizada, empezando en 1. */
    readonly secuencia: number,
    readonly folio: string,
    readonly lat: number,
    readonly lng: number,
    readonly peso: number,
    readonly direccion: string | null,
    readonly estado: EstadoOrden,
    readonly estadoDescripcion: string,
    /** En la primera parada se mide desde la posición actual del repartidor. */
    readonly distanciaDesdeAnteriorKm: number,
    readonly distanciaAcumuladaKm: number,
  ) {}

  static fromPlain(plain: ParadaPlain): Parada {
    return new Parada(
      plain.secuencia,
      plain.folio,
      plain.lat,
      plain.lng,
      plain.peso,
      plain.direccion,
      plain.estado,
      plain.estadoDescripcion,
      plain.distanciaDesdeAnteriorKm,
      plain.distanciaAcumuladaKm,
    );
  }

  /** Destino legible: la dirección de referencia o, si no se envió, las coordenadas. */
  get destino(): string {
    return this.direccion ?? `${this.lat.toFixed(4)}, ${this.lng.toFixed(4)}`;
  }

  /** Una parada se entrega cuando su orden ya está en ruta. */
  get entregable(): boolean {
    return this.estado === 'EN_RUTA';
  }
}
