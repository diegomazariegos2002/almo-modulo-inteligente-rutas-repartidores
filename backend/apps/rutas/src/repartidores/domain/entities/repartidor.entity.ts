import type { PuntoGeografico } from '../../../shared/domain/services/distancia-haversine.service';
import { ESTADO_REPARTIDOR, type EstadoRepartidor } from '../value-objects/estado-repartidor.vo';

export interface RepartidorProps {
  id: number;
  nombre: string;
  /** Posición actual. */
  lat: number;
  lng: number;
  estado: EstadoRepartidor;
  capacidadKg: number;
  /** Suma del peso de sus paradas pendientes. */
  cargaKg: number;
  paradasPendientes: number;
}

/** Tolerancia para comparar kilogramos con decimales sin tropezar con el punto flotante. */
const EPSILON_KG = 1e-9;

/**
 * Repartidor con su posición, su estado y la carga que lleva.
 *
 * Ciclo: espera DISPONIBLE mientras se le asignan órdenes → sale EN_RUTA →
 * entrega una parada tras otra (su posición pasa a ser el destino entregado) →
 * al quedarse sin paradas vuelve a DISPONIBLE.
 */
export class Repartidor implements PuntoGeografico {
  readonly id: number;
  readonly nombre: string;
  readonly capacidadKg: number;

  private _lat: number;
  private _lng: number;
  private _estado: EstadoRepartidor;
  private _cargaKg: number;
  private _paradasPendientes: number;

  constructor(props: RepartidorProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.capacidadKg = props.capacidadKg;
    this._lat = props.lat;
    this._lng = props.lng;
    this._estado = props.estado;
    this._cargaKg = props.cargaKg;
    this._paradasPendientes = props.paradasPendientes;
  }

  get lat(): number {
    return this._lat;
  }

  get lng(): number {
    return this._lng;
  }

  get estado(): EstadoRepartidor {
    return this._estado;
  }

  get cargaKg(): number {
    return this._cargaKg;
  }

  get paradasPendientes(): number {
    return this._paradasPendientes;
  }

  get disponible(): boolean {
    return this._estado === ESTADO_REPARTIDOR.DISPONIBLE;
  }

  get capacidadLibreKg(): number {
    return Math.max(0, this.capacidadKg - this._cargaKg);
  }

  /** Puede recibir una orden nueva: está disponible y el paquete le cabe. */
  puedeRecibir(pesoKg: number): boolean {
    return this.disponible && this._cargaKg + pesoKg <= this.capacidadKg + EPSILON_KG;
  }

  /** Suma una orden recién asignada a su carga. */
  registrarAsignacion(pesoKg: number): void {
    this._cargaKg += pesoKg;
    this._paradasPendientes += 1;
  }

  /** Sale a entregar: deja de recibir órdenes hasta terminar. */
  salirARuta(): void {
    this._estado = ESTADO_REPARTIDOR.EN_RUTA;
  }

  /**
   * Entregó una parada: ahora está en el destino de esa entrega y lleva menos carga.
   * Si era la última, queda disponible de nuevo.
   */
  registrarEntrega(destino: PuntoGeografico, pesoKg: number): void {
    this._lat = destino.lat;
    this._lng = destino.lng;
    this._cargaKg = Math.max(0, this._cargaKg - pesoKg);
    this._paradasPendientes = Math.max(0, this._paradasPendientes - 1);

    if (this._paradasPendientes === 0) {
      this._cargaKg = 0;
      this._estado = ESTADO_REPARTIDOR.DISPONIBLE;
    }
  }
}
