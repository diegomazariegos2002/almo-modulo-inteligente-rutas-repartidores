import { isErr, type Result } from '@almo/result';
import { DespachoService } from '../ordenes/application/services/despacho.service';
import { CrearOrdenUseCase } from '../ordenes/application/use-cases/crear-orden/crear-orden.use-case';
import { EntregarOrdenUseCase } from '../ordenes/application/use-cases/entregar-orden/entregar-orden.use-case';
import { IniciarRutaUseCase } from '../ordenes/application/use-cases/iniciar-ruta/iniciar-ruta.use-case';
import { ListarOrdenesUseCase } from '../ordenes/application/use-cases/listar-ordenes/listar-ordenes.use-case';
import { ObtenerOrdenUseCase } from '../ordenes/application/use-cases/obtener-orden/obtener-orden.use-case';
import type { DespachoLock } from '../ordenes/domain/ports/outbound/despacho-lock.port';
import { ListarRepartidoresUseCase } from '../repartidores/application/use-cases/listar-repartidores/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from '../repartidores/application/use-cases/obtener-ruta-repartidor/obtener-ruta-repartidor.use-case';
import {
  BaseEnMemoria,
  DespachoLockEnMemoria,
  DespachoLockSinExclusion,
  OrdenRepositoryEnMemoria,
  RepartidorRepositoryEnMemoria,
  RutaCacheEnMemoria,
  TxManagerEnMemoria,
} from './en-memoria.fakes';

/**
 * Arma todos los casos de uso sobre los dobles en memoria. Solo para pruebas.
 * Con `sinExclusion` se usa un bloqueo que no bloquea, para demostrar la carrera.
 */
export function crearEscenario(opciones: { sinExclusion?: boolean } = {}) {
  const base = new BaseEnMemoria();
  const ordenes = new OrdenRepositoryEnMemoria(base);
  const repartidores = new RepartidorRepositoryEnMemoria(base);
  const tx = new TxManagerEnMemoria(base);
  const bloqueo = new DespachoLockEnMemoria(tx);
  const lock: DespachoLock = opciones.sinExclusion ? new DespachoLockSinExclusion() : bloqueo;
  const cache = new RutaCacheEnMemoria();
  const despacho = new DespachoService(ordenes, repartidores);

  return {
    base,
    ordenes,
    repartidores,
    bloqueo,
    cache,
    crearOrden: new CrearOrdenUseCase(tx, lock, ordenes, repartidores, despacho, cache),
    iniciarRuta: new IniciarRutaUseCase(tx, lock, ordenes, repartidores, despacho, cache),
    entregarOrden: new EntregarOrdenUseCase(tx, lock, ordenes, repartidores, despacho, cache),
    listarOrdenes: new ListarOrdenesUseCase(ordenes),
    obtenerOrden: new ObtenerOrdenUseCase(ordenes),
    obtenerRuta: new ObtenerRutaRepartidorUseCase(repartidores, cache),
    listarRepartidores: new ListarRepartidoresUseCase(repartidores),
  };
}

export type Escenario = ReturnType<typeof crearEscenario>;

/** Desenvuelve un `ok` o hace fallar la prueba mostrando el error recibido. */
export function valorDe<T, E>(resultado: Result<T, E>): T {
  if (isErr(resultado)) {
    throw new Error(`Se esperaba ok y llegó err: ${JSON.stringify(resultado.error)}`);
  }
  return resultado.value;
}

/** Desenvuelve un `err` o hace fallar la prueba. */
export function errorDe<T, E>(resultado: Result<T, E>): E {
  if (!isErr(resultado)) {
    throw new Error(`Se esperaba err y llegó ok: ${JSON.stringify(resultado.value)}`);
  }
  return resultado.error;
}
