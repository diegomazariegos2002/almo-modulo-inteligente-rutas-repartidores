import { TestBed } from '@angular/core/testing';
import { LOGGER_CONTRACT, LoggerContract } from '@shared/Application/contracts/logger.contract';
import { Sesion } from '../../Domain/sesion.entity';
import { crearSesion, USUARIO_REPARTIDOR } from '../Angular/_fixtures/usuarios.fixtures';
import { SesionStorageAdapter } from './sesion-storage.adapter';

const CLAVE = 'rutas.sesion';

describe('SesionStorageAdapter', () => {
  let logger: jasmine.SpyObj<LoggerContract>;

  /** Crea el adapter como lo haría la aplicación al arrancar, con lo que haya guardado. */
  function crearAdapter(): SesionStorageAdapter {
    return TestBed.inject(SesionStorageAdapter);
  }

  beforeEach(() => {
    sessionStorage.clear();
    logger = jasmine.createSpyObj<LoggerContract>('LoggerContract', ['warn', 'error']);
    TestBed.configureTestingModule({
      providers: [SesionStorageAdapter, { provide: LOGGER_CONTRACT, useValue: logger }],
    });
  });

  afterEach(() => sessionStorage.clear());

  it('arranca sin sesión cuando no hay nada guardado', () => {
    expect(crearAdapter().actual()).toBeNull();
  });

  it('guardar() publica la sesión y la persiste en el navegador', () => {
    const adapter = crearAdapter();
    const sesion = crearSesion(USUARIO_REPARTIDOR);

    adapter.guardar(sesion);

    expect(adapter.actual()).toBe(sesion);
    expect(JSON.parse(sessionStorage.getItem(CLAVE) ?? '{}')).toEqual(sesion.toPlain());
  });

  it('limpiar() olvida la sesión en memoria y en el navegador', () => {
    const adapter = crearAdapter();
    adapter.guardar(crearSesion(USUARIO_REPARTIDOR));

    adapter.limpiar();

    expect(adapter.actual()).toBeNull();
    expect(sessionStorage.getItem(CLAVE)).toBeNull();
  });

  it('recupera la sesión guardada al volver a cargar la aplicación', () => {
    const guardada = crearSesion(USUARIO_REPARTIDOR);
    sessionStorage.setItem(CLAVE, JSON.stringify(guardada.toPlain()));

    const restaurada = crearAdapter().actual();

    expect(restaurada).toBeInstanceOf(Sesion);
    expect(restaurada?.accessToken).toBe(guardada.accessToken);
    expect(restaurada?.usuario.repartidorId).toBe(1);
  });

  it('descarta una sesión guardada que ya expiró', () => {
    const vencida = new Sesion('token-vencido', new Date(Date.now() - 1000), USUARIO_REPARTIDOR);
    sessionStorage.setItem(CLAVE, JSON.stringify(vencida.toPlain()));

    expect(crearAdapter().actual()).toBeNull();
    expect(sessionStorage.getItem(CLAVE)).toBeNull();
  });

  it('descarta y registra una sesión guardada que no se puede leer', () => {
    sessionStorage.setItem(CLAVE, '{ esto no es JSON');

    expect(crearAdapter().actual()).toBeNull();
    expect(sessionStorage.getItem(CLAVE)).toBeNull();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
