import { CambioEstado, EstadoOrden, OrdenPlain, RepartidorAsignado } from './orden.models';

export class Orden {
  constructor(
    readonly folio: string,
    readonly lat: number,
    readonly lng: number,
    readonly peso: number,
    readonly direccion: string | null,
    readonly estado: EstadoOrden,
    readonly estadoDescripcion: string,
    readonly repartidor: RepartidorAsignado | null,
    readonly secuenciaRuta: number | null,
    readonly creadaEn: Date,
    readonly actualizadaEn: Date,
    readonly historial: readonly CambioEstado[],
  ) {}

  static fromPlain(plain: OrdenPlain): Orden {
    return new Orden(
      plain.folio,
      plain.lat,
      plain.lng,
      plain.peso,
      plain.direccion,
      plain.estado,
      plain.estadoDescripcion,
      plain.repartidor,
      plain.secuenciaRuta,
      new Date(plain.creadaEn),
      new Date(plain.actualizadaEn),
      plain.historial.map((cambio) => ({ ...cambio, fecha: new Date(cambio.fecha) })),
    );
  }

  /**
   * En cola: no había repartidor disponible con capacidad. No es un fallo; la orden
   * se asigna sola cuando un repartidor se libera.
   */
  get enCola(): boolean {
    return this.estado === 'PENDIENTE_ASIGNACION';
  }

  /** Destino legible: la dirección de referencia o, si no se envió, las coordenadas. */
  get destino(): string {
    return this.direccion ?? `${this.lat.toFixed(4)}, ${this.lng.toFixed(4)}`;
  }
}
