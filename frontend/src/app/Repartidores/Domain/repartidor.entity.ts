import { EstadoRepartidor, RepartidorPlain } from './repartidor.models';

export class Repartidor {
  constructor(
    readonly id: number,
    readonly nombre: string,
    readonly estado: EstadoRepartidor,
    readonly estadoDescripcion: string,
    /** Posición actual; desde ella se mide la distancia a la primera parada. */
    readonly lat: number,
    readonly lng: number,
    readonly capacidadKg: number,
    readonly cargaKg: number,
    /** Solo se conoce en el listado de despacho; dentro de una ruta es `null`. */
    readonly paradasPendientes: number | null,
  ) {}

  static fromPlain(plain: RepartidorPlain): Repartidor {
    return new Repartidor(
      plain.id,
      plain.nombre,
      plain.estado,
      plain.estadoDescripcion,
      plain.lat,
      plain.lng,
      plain.capacidadKg,
      plain.cargaKg,
      plain.paradasPendientes ?? null,
    );
  }

  /** Ya salió a ruta: no recibe órdenes nuevas hasta entregar todas sus paradas. */
  get enRuta(): boolean {
    return this.estado === 'EN_RUTA';
  }

  /** Porcentaje de la capacidad que ocupa la carga actual, entre 0 y 100. */
  get porcentajeCarga(): number {
    if (this.capacidadKg <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.cargaKg / this.capacidadKg) * 100));
  }
}
