/*
 * Dobles en memoria de los puertos de salida, para probar los casos de uso sin
 * base de datos ni Redis. Reproducen el comportamiento observable de los
 * adaptadores reales: cada lectura devuelve instancias nuevas (como una consulta)
 * y la "transacción" se revierte si el trabajo falla.
 *
 * Solo para pruebas: nunca se importa desde código de producción.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { DomainError } from '@almo/exceptions';
import { err, ok, type Result } from '@almo/result';
import { TransactionManagerPort } from '@almo/transactions';
import { type CambioEstado, Orden } from '../ordenes/domain/entities/orden.entity';
import { DespachoLock } from '../ordenes/domain/ports/outbound/despacho-lock.port';
import {
  type FiltroOrdenes,
  type NuevaOrden,
  OrdenRepository,
  type PaginaOrdenes,
} from '../ordenes/domain/ports/outbound/orden.repository.port';
import { Repartidor } from '../repartidores/domain/entities/repartidor.entity';
import { RepartidorRepository } from '../repartidores/domain/ports/outbound/repartidor.repository.port';
import { RutaCache } from '../repartidores/domain/ports/outbound/ruta-cache.port';
import { ESTADO_REPARTIDOR, type EstadoRepartidor } from '../repartidores/domain/value-objects/estado-repartidor.vo';
import type { ParadaPendiente } from '../repartidores/domain/value-objects/parada.vo';
import type { Ruta } from '../repartidores/domain/value-objects/ruta.vo';
import { RutasPersistenceError } from '../shared/domain/exceptions/rutas-persistence.exception';
import { ESTADO_ORDEN, type EstadoOrden, ESTADOS_PARADA_PENDIENTE } from '../shared/domain/value-objects/estado-orden.vo';

interface FilaRepartidor {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  estado: EstadoRepartidor;
  capacidadKg: number;
}

interface FilaOrden {
  id: string;
  folio: string;
  lat: number;
  lng: number;
  pesoKg: number;
  direccion: string | null;
  estado: EstadoOrden;
  clienteId: string;
  repartidorId: number | null;
  secuenciaRuta: number | null;
  creadaEn: Date;
  actualizadaEn: Date;
  historial: CambioEstado[];
}

/** Las "tablas". Los repositorios falsos leen y escriben aquí. */
export class BaseEnMemoria {
  repartidores: FilaRepartidor[] = [];
  ordenes: FilaOrden[] = [];
  private consecutivo = 0;

  agregarRepartidor(fila: Partial<FilaRepartidor> & Pick<FilaRepartidor, 'id' | 'lat' | 'lng'>): this {
    this.repartidores.push({
      nombre: `Repartidor ${fila.id}`,
      estado: ESTADO_REPARTIDOR.DISPONIBLE,
      capacidadKg: 50,
      ...fila,
    });
    return this;
  }

  siguienteFolio(): string {
    this.consecutivo += 1;
    return `ORD-${String(this.consecutivo).padStart(6, '0')}`;
  }

  orden(folio: string): FilaOrden {
    const fila = this.ordenes.find((o) => o.folio === folio);
    if (!fila) throw new Error(`No existe la orden ${folio} en la base en memoria`);
    return fila;
  }

  repartidor(id: number): FilaRepartidor {
    const fila = this.repartidores.find((r) => r.id === id);
    if (!fila) throw new Error(`No existe el repartidor ${id} en la base en memoria`);
    return fila;
  }

  paradasDe(repartidorId: number): FilaOrden[] {
    return this.ordenes
      .filter((o) => o.repartidorId === repartidorId && ESTADOS_PARADA_PENDIENTE.includes(o.estado))
      .sort((a, b) => (a.secuenciaRuta ?? Number.MAX_SAFE_INTEGER) - (b.secuenciaRuta ?? Number.MAX_SAFE_INTEGER));
  }

  /** Folios de la ruta de un repartidor, en orden: lo que más se comprueba en las pruebas. */
  rutaDe(repartidorId: number): string[] {
    return this.paradasDe(repartidorId).map((o) => o.folio);
  }

  copiar(): { repartidores: FilaRepartidor[]; ordenes: FilaOrden[]; consecutivo: number } {
    return {
      repartidores: this.repartidores.map((r) => ({ ...r })),
      ordenes: this.ordenes.map((o) => ({ ...o, historial: [...o.historial] })),
      consecutivo: this.consecutivo,
    };
  }

  restaurar(copia: ReturnType<BaseEnMemoria['copiar']>): void {
    this.repartidores = copia.repartidores;
    this.ordenes = copia.ordenes;
    this.consecutivo = copia.consecutivo;
  }

  /** Deja la base vacía, como recién creada. */
  vaciar(): void {
    this.restaurar({ repartidores: [], ordenes: [], consecutivo: 0 });
  }
}

export class OrdenRepositoryEnMemoria extends OrdenRepository {
  /** Si se define, la operación con ese nombre falla (para probar la reversión). */
  fallarEn: string | null = null;

  constructor(private readonly base: BaseEnMemoria) {
    super();
  }

  async crear(nueva: NuevaOrden): Promise<Result<Orden, DomainError>> {
    if (this.fallarEn === 'crear') return this.fallo('crear');

    const folio = this.base.siguienteFolio();
    const fila: FilaOrden = {
      id: `id-${folio}`,
      folio,
      lat: nueva.destino.lat,
      lng: nueva.destino.lng,
      pesoKg: nueva.peso.kg,
      direccion: nueva.direccion,
      estado: ESTADO_ORDEN.PENDIENTE_ASIGNACION,
      clienteId: nueva.clienteId,
      repartidorId: null,
      secuenciaRuta: null,
      creadaEn: nueva.creadaEn,
      actualizadaEn: nueva.creadaEn,
      historial: [{ estado: ESTADO_ORDEN.PENDIENTE_ASIGNACION, fecha: nueva.creadaEn, repartidorId: null }],
    };
    this.base.ordenes.push(fila);
    return ok(this.aDominio(fila));
  }

  async findByFolio(folio: string): Promise<Result<Orden | null, DomainError>> {
    if (this.fallarEn === 'findByFolio') return this.fallo('findByFolio');

    const fila = this.base.ordenes.find((o) => o.folio === folio);
    return ok(fila ? this.aDominio(fila) : null);
  }

  async findPendientesDeAsignacion(): Promise<Result<Orden[], DomainError>> {
    const filas = this.base.ordenes
      .filter((o) => o.estado === ESTADO_ORDEN.PENDIENTE_ASIGNACION)
      .sort((a, b) => a.creadaEn.getTime() - b.creadaEn.getTime() || a.folio.localeCompare(b.folio));
    return ok(filas.map((fila) => this.aDominio(fila)));
  }

  async findAsignadasDe(repartidorId: number): Promise<Result<Orden[], DomainError>> {
    const filas = this.base.ordenes.filter((o) => o.repartidorId === repartidorId && o.estado === ESTADO_ORDEN.ASIGNADA);
    return ok(filas.map((fila) => this.aDominio(fila)));
  }

  async listar(filtro: FiltroOrdenes): Promise<Result<PaginaOrdenes, DomainError>> {
    const filas = this.base.ordenes
      .filter((o) => filtro.estado === undefined || o.estado === filtro.estado)
      .filter((o) => filtro.clienteId === undefined || o.clienteId === filtro.clienteId)
      .filter((o) => filtro.repartidorId === undefined || o.repartidorId === filtro.repartidorId)
      .sort((a, b) => b.creadaEn.getTime() - a.creadaEn.getTime() || b.folio.localeCompare(a.folio));

    const inicio = (filtro.page - 1) * filtro.limit;
    return ok({ ordenes: filas.slice(inicio, inicio + filtro.limit).map((fila) => this.aDominio(fila)), total: filas.length });
  }

  async guardar(orden: Orden): Promise<Result<void, DomainError>> {
    if (this.fallarEn === 'guardar') return this.fallo('guardar');

    const fila = this.base.orden(orden.folio);
    fila.estado = orden.estado;
    fila.repartidorId = orden.repartidor?.id ?? null;
    fila.secuenciaRuta = orden.secuenciaRuta;
    fila.actualizadaEn = orden.actualizadaEn;
    fila.historial.push(...orden.cambiosSinPersistir);
    orden.marcarPersistida();
    return ok(undefined);
  }

  async actualizarSecuencias(foliosEnOrden: readonly string[]): Promise<Result<void, DomainError>> {
    if (this.fallarEn === 'actualizarSecuencias') return this.fallo('actualizarSecuencias');

    foliosEnOrden.forEach((folio, indice) => {
      this.base.orden(folio).secuenciaRuta = indice + 1;
    });
    return ok(undefined);
  }

  private aDominio(fila: FilaOrden): Orden {
    const repartidor = fila.repartidorId === null ? null : this.base.repartidor(fila.repartidorId);
    return new Orden({
      ...fila,
      repartidor: repartidor ? { id: repartidor.id, nombre: repartidor.nombre } : null,
      historial: [...fila.historial],
    });
  }

  private fallo(operacion: string): Result<never, DomainError> {
    return err(new RutasPersistenceError(operacion, 'fallo simulado'));
  }
}

export class RepartidorRepositoryEnMemoria extends RepartidorRepository {
  constructor(private readonly base: BaseEnMemoria) {
    super();
  }

  async findById(id: number): Promise<Result<Repartidor | null, DomainError>> {
    const fila = this.base.repartidores.find((r) => r.id === id);
    return ok(fila ? this.aDominio(fila) : null);
  }

  async findAll(): Promise<Result<Repartidor[], DomainError>> {
    return ok(this.ordenados().map((fila) => this.aDominio(fila)));
  }

  async findDisponibles(): Promise<Result<Repartidor[], DomainError>> {
    return ok(
      this.ordenados()
        .filter((r) => r.estado === ESTADO_REPARTIDOR.DISPONIBLE)
        .map((fila) => this.aDominio(fila)),
    );
  }

  async findParadasPendientes(repartidorId: number): Promise<Result<ParadaPendiente[], DomainError>> {
    return ok(
      this.base.paradasDe(repartidorId).map((o) => ({
        folio: o.folio,
        lat: o.lat,
        lng: o.lng,
        pesoKg: o.pesoKg,
        direccion: o.direccion,
        estado: o.estado,
      })),
    );
  }

  async guardar(repartidor: Repartidor): Promise<Result<void, DomainError>> {
    const fila = this.base.repartidor(repartidor.id);
    fila.estado = repartidor.estado;
    fila.lat = repartidor.lat;
    fila.lng = repartidor.lng;
    return ok(undefined);
  }

  private ordenados(): FilaRepartidor[] {
    return [...this.base.repartidores].sort((a, b) => a.id - b.id);
  }

  private aDominio(fila: FilaRepartidor): Repartidor {
    const paradas = this.base.paradasDe(fila.id);
    return new Repartidor({
      ...fila,
      cargaKg: paradas.reduce((total, o) => total + o.pesoKg, 0),
      paradasPendientes: paradas.length,
    });
  }
}

interface ContextoTransaccion {
  /** Estado de la base al entrar a la sección crítica: a él se vuelve si algo falla. */
  copia: ReturnType<BaseEnMemoria['copiar']> | null;
  alTerminar: Array<() => void>;
}

/**
 * Transacción de mentira: si el trabajo lanza, deja la base como estaba cuando
 * la transacción tomó el bloqueo, y al terminar (bien o mal) lo libera.
 */
export class TxManagerEnMemoria extends TransactionManagerPort {
  private readonly actual = new AsyncLocalStorage<ContextoTransaccion>();

  constructor(private readonly base: BaseEnMemoria) {
    super();
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const contexto: ContextoTransaccion = { copia: null, alTerminar: [] };
    try {
      return await this.actual.run(contexto, fn);
    } catch (error) {
      if (contexto.copia) this.base.restaurar(contexto.copia);
      throw error;
    } finally {
      contexto.alTerminar.forEach((liberar) => liberar());
    }
  }

  /** Lo llama el bloqueo al adquirirse: desde aquí la transacción trabaja sola. */
  entrarEnSeccionCritica(liberar: () => void): void {
    const contexto = this.actual.getStore();
    if (!contexto) throw new Error('El bloqueo de despacho debe adquirirse dentro de una transacción');

    contexto.copia = this.base.copiar();
    contexto.alTerminar.push(liberar);
  }
}

/**
 * Bloqueo de despacho en memoria con la misma semántica que el real: quien lo
 * pide espera su turno y lo conserva hasta que termina su transacción.
 */
export class DespachoLockEnMemoria extends DespachoLock {
  adquisiciones = 0;
  private turno: Promise<void> = Promise.resolve();

  constructor(private readonly tx: TxManagerEnMemoria) {
    super();
  }

  async adquirir(): Promise<Result<void, DomainError>> {
    const anterior = this.turno;
    let liberar: () => void = () => undefined;
    this.turno = new Promise<void>((resolve) => {
      liberar = resolve;
    });

    await anterior;
    this.tx.entrarEnSeccionCritica(liberar);
    this.adquisiciones += 1;
    return ok(undefined);
  }
}

/** Bloqueo que no bloquea: sirve para demostrar qué pasa sin exclusión mutua. */
export class DespachoLockSinExclusion extends DespachoLock {
  async adquirir(): Promise<Result<void, DomainError>> {
    return ok(undefined);
  }
}

export class RutaCacheEnMemoria extends RutaCache {
  readonly entradas = new Map<number, Ruta>();
  readonly invalidaciones: number[][] = [];

  async get(repartidorId: number): Promise<Ruta | null> {
    return this.entradas.get(repartidorId) ?? null;
  }

  async set(repartidorId: number, ruta: Ruta): Promise<void> {
    this.entradas.set(repartidorId, ruta);
  }

  async invalidar(...repartidorIds: number[]): Promise<void> {
    this.invalidaciones.push(repartidorIds);
    repartidorIds.forEach((id) => this.entradas.delete(id));
  }

  vaciar(): void {
    this.entradas.clear();
    this.invalidaciones.length = 0;
  }
}
