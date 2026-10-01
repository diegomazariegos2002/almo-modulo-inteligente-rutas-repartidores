import { err, isErr, ok, type Result } from '@almo/result';
import type { PuntoGeografico } from '../../../shared/domain/services/distancia-haversine.service';
import { ESTADO_ORDEN, type EstadoOrden, puedeTransicionar } from '../../../shared/domain/value-objects/estado-orden.vo';
import { TransicionEstadoInvalida } from '../exceptions';

/** Un cambio de estado con su fecha: la bitácora de la orden. */
export interface CambioEstado {
  readonly estado: EstadoOrden;
  readonly fecha: Date;
  /** Repartidor a cargo en ese momento; `null` mientras la orden está en cola. */
  readonly repartidorId: number | null;
}

export interface RepartidorAsignado {
  readonly id: number;
  readonly nombre: string;
}

export interface OrdenProps {
  id: string;
  folio: string;
  lat: number;
  lng: number;
  pesoKg: number;
  direccion: string | null;
  estado: EstadoOrden;
  clienteId: string;
  repartidor: RepartidorAsignado | null;
  secuenciaRuta: number | null;
  creadaEn: Date;
  actualizadaEn: Date;
  historial: CambioEstado[];
}

/**
 * Orden de entrega (raíz del agregado).
 *
 * Protege la máquina de estados: solo se avanza un paso a la vez
 * (pendiente → asignada → en ruta → entregada) y cada cambio queda anotado en el
 * historial con su fecha. Los cambios que aún no se han guardado se exponen en
 * `cambiosSinPersistir` para que el repositorio inserte solo esas filas.
 */
export class Orden implements PuntoGeografico {
  readonly id: string;
  readonly folio: string;
  readonly lat: number;
  readonly lng: number;
  readonly pesoKg: number;
  readonly direccion: string | null;
  readonly clienteId: string;
  readonly creadaEn: Date;

  private _estado: EstadoOrden;
  private _repartidor: RepartidorAsignado | null;
  private _secuenciaRuta: number | null;
  private _actualizadaEn: Date;
  private readonly _historial: CambioEstado[];
  private readonly _cambiosSinPersistir: CambioEstado[] = [];

  constructor(props: OrdenProps) {
    this.id = props.id;
    this.folio = props.folio;
    this.lat = props.lat;
    this.lng = props.lng;
    this.pesoKg = props.pesoKg;
    this.direccion = props.direccion;
    this.clienteId = props.clienteId;
    this.creadaEn = props.creadaEn;
    this._estado = props.estado;
    this._repartidor = props.repartidor;
    this._secuenciaRuta = props.secuenciaRuta;
    this._actualizadaEn = props.actualizadaEn;
    this._historial = [...props.historial];
  }

  get estado(): EstadoOrden {
    return this._estado;
  }

  get repartidor(): RepartidorAsignado | null {
    return this._repartidor;
  }

  get secuenciaRuta(): number | null {
    return this._secuenciaRuta;
  }

  get actualizadaEn(): Date {
    return this._actualizadaEn;
  }

  get historial(): readonly CambioEstado[] {
    return this._historial;
  }

  get cambiosSinPersistir(): readonly CambioEstado[] {
    return this._cambiosSinPersistir;
  }

  /** PENDIENTE_ASIGNACION → ASIGNADA. */
  asignarA(repartidor: RepartidorAsignado, ahora: Date): Result<void, TransicionEstadoInvalida> {
    const transicion = this.transicionar(ESTADO_ORDEN.ASIGNADA, ahora, repartidor.id);
    if (isErr(transicion)) return transicion;

    this._repartidor = repartidor;
    return transicion;
  }

  /** ASIGNADA → EN_RUTA: el repartidor salió a entregar. */
  iniciarRuta(ahora: Date): Result<void, TransicionEstadoInvalida> {
    return this.transicionar(ESTADO_ORDEN.EN_RUTA, ahora, this._repartidor?.id ?? null);
  }

  /** EN_RUTA → ENTREGADA: deja de ser una parada pendiente. */
  entregar(ahora: Date): Result<void, TransicionEstadoInvalida> {
    const transicion = this.transicionar(ESTADO_ORDEN.ENTREGADA, ahora, this._repartidor?.id ?? null);
    if (isErr(transicion)) return transicion;

    this._secuenciaRuta = null;
    return transicion;
  }

  /** El repositorio lo llama tras guardar: ya no quedan cambios pendientes. */
  marcarPersistida(): void {
    this._cambiosSinPersistir.length = 0;
  }

  private transicionar(hacia: EstadoOrden, ahora: Date, repartidorId: number | null): Result<void, TransicionEstadoInvalida> {
    if (!puedeTransicionar(this._estado, hacia)) {
      return err(new TransicionEstadoInvalida(this.folio, this._estado, hacia));
    }

    const cambio: CambioEstado = { estado: hacia, fecha: ahora, repartidorId };
    this._estado = hacia;
    this._actualizadaEn = ahora;
    this._historial.push(cambio);
    this._cambiosSinPersistir.push(cambio);
    return ok(undefined);
  }
}
