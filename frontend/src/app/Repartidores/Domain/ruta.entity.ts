import { Parada } from './parada.entity';
import { Repartidor } from './repartidor.entity';
import { RutaPlain } from './repartidor.models';

/** Ruta de un repartidor: sus paradas pendientes en el orden que calculó el algoritmo. */
export class Ruta {
  constructor(
    readonly repartidor: Repartidor,
    readonly paradas: readonly Parada[],
    readonly totalParadas: number,
    readonly distanciaTotalKm: number,
    readonly calculadaEn: Date,
  ) {}

  static fromPlain(plain: RutaPlain): Ruta {
    return new Ruta(
      Repartidor.fromPlain(plain.repartidor),
      plain.paradas.map((parada) => Parada.fromPlain(parada)),
      plain.totalParadas,
      plain.distanciaTotalKm,
      new Date(plain.calculadaEn),
    );
  }

  get vacia(): boolean {
    return this.paradas.length === 0;
  }

  get primeraParada(): Parada | null {
    return this.paradas[0] ?? null;
  }

  /** El repartidor puede salir a ruta si tiene paradas y todavía no ha salido. */
  get puedeIniciarse(): boolean {
    return !this.vacia && !this.repartidor.enRuta;
  }
}
