import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { Usuario } from '@auth/Domain/usuario.entity';
import {
  crearSesionEnMemoria,
  USUARIO_ADMIN,
  USUARIO_REPARTIDOR,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { CambiarEstadoOrdenUseCase } from '@ordenes/Application/cambiar-estado-orden.use-case';
import { Orden } from '@ordenes/Domain/orden.entity';
import { ORDEN_EN_RUTA } from '@ordenes/Infrastructure/Angular/_fixtures/ordenes.fixtures';
import { ResultadoEscritura } from '@shared/Domain/api.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { of, Subject, throwError } from 'rxjs';
import { ObtenerRutaRepartidorUseCase } from '../../../Application/obtener-ruta-repartidor.use-case';
import { Ruta } from '../../../Domain/ruta.entity';
import { RUTA_ANA, RUTA_CARLA, RUTA_VACIA } from '../_fixtures/repartidores.fixtures';
import { MiRutaPageComponent } from './mi-ruta-page.component';

describe('MiRutaPageComponent', () => {
  let fixture: ComponentFixture<MiRutaPageComponent>;
  let elemento: HTMLElement;
  let obtenerRuta: jasmine.SpyObj<ObtenerRutaRepartidorUseCase>;
  let cambiarEstado: jasmine.SpyObj<CambiarEstadoOrdenUseCase>;

  function crear(usuario: Usuario = USUARIO_REPARTIDOR): void {
    TestBed.configureTestingModule({
      imports: [MiRutaPageComponent],
      providers: [
        { provide: ObtenerRutaRepartidorUseCase, useValue: obtenerRuta },
        { provide: CambiarEstadoOrdenUseCase, useValue: cambiarEstado },
        { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria(usuario) },
      ],
    });
    fixture = TestBed.createComponent(MiRutaPageComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  function boton(texto: string): HTMLButtonElement | undefined {
    return Array.from(elemento.querySelectorAll('button')).find((candidato) =>
      candidato.textContent?.includes(texto),
    );
  }

  function pulsar(texto: string): void {
    boton(texto)?.click();
    fixture.detectChanges();
  }

  const avisos = (rol: string) =>
    Array.from(elemento.querySelectorAll(`[role="${rol}"] p`)).map((p) => p.textContent?.trim());

  beforeEach(() => {
    obtenerRuta = jasmine.createSpyObj<ObtenerRutaRepartidorUseCase>('ObtenerRuta', ['execute']);
    cambiarEstado = jasmine.createSpyObj<CambiarEstadoOrdenUseCase>('CambiarEstado', ['execute']);
    obtenerRuta.execute.and.returnValue(of(RUTA_ANA));
  });

  it('carga la ruta del repartidor vinculado al usuario en sesión', () => {
    crear();

    expect(obtenerRuta.execute).toHaveBeenCalledOnceWith(1);
    expect(elemento.querySelectorAll('app-parada-card').length).toBe(2);
    expect(elemento.textContent).toContain('6.02 km');
  });

  it('muestra un indicador de carga hasta que llega la ruta', () => {
    const respuesta = new Subject<Ruta>();
    obtenerRuta.execute.and.returnValue(respuesta);
    crear();
    expect(elemento.querySelector('app-spinner')).not.toBeNull();

    respuesta.next(RUTA_ANA);
    fixture.detectChanges();

    expect(elemento.querySelector('app-spinner')).toBeNull();
  });

  it('«Iniciar ruta» registra la salida sobre la primera parada, muestra el mensaje y recarga', () => {
    cambiarEstado.execute.and.returnValue(
      of({ mensaje: 'Ana López salió a ruta con 2 paradas.', data: ORDEN_EN_RUTA }),
    );
    crear();
    obtenerRuta.execute.and.returnValue(of(RUTA_CARLA));

    pulsar('Iniciar ruta');

    expect(cambiarEstado.execute).toHaveBeenCalledOnceWith('ORD-000003', 'EN_RUTA');
    expect(avisos('status')).toContain('Ana López salió a ruta con 2 paradas.');
    expect(obtenerRuta.execute).toHaveBeenCalledTimes(2);
    expect(boton('Iniciar ruta')).toBeUndefined();
  });

  it('«Marcar entregada» entrega esa parada, muestra el mensaje y recarga', () => {
    obtenerRuta.execute.and.returnValue(of(RUTA_CARLA));
    cambiarEstado.execute.and.returnValue(
      of({ mensaje: 'Orden ORD-000002 entregada.', data: ORDEN_EN_RUTA }),
    );
    crear();
    obtenerRuta.execute.and.returnValue(of(RUTA_VACIA));

    pulsar('Marcar entregada');

    expect(cambiarEstado.execute).toHaveBeenCalledOnceWith('ORD-000002', 'ENTREGADA');
    expect(avisos('status')).toContain('Orden ORD-000002 entregada.');
    expect(elemento.textContent).toContain('Sin paradas pendientes');
  });

  it('mientras una acción está en curso bloquea las demás', () => {
    cambiarEstado.execute.and.returnValue(new Subject<ResultadoEscritura<Orden>>());
    crear();

    pulsar('Iniciar ruta');

    expect(boton('Iniciando ruta…')?.disabled).toBeTrue();
    expect(boton('Actualizar')?.disabled).toBeTrue();
  });

  it('si la acción falla muestra el motivo y recarga la ruta, que puede haber cambiado', () => {
    cambiarEstado.execute.and.returnValue(
      throwError(
        () =>
          new ErrorAplicacion('La orden ya cambió de estado.', 'RUTAS.TRANSICION_ESTADO_INVALIDA'),
      ),
    );
    crear();

    pulsar('Iniciar ruta');

    expect(avisos('alert')).toEqual(['La orden ya cambió de estado.']);
    expect(obtenerRuta.execute).toHaveBeenCalledTimes(2);
    expect(boton('Iniciar ruta')?.disabled).toBeFalse();
  });

  it('si la ruta no carga muestra el error con la opción de reintentar', () => {
    obtenerRuta.execute.and.returnValues(
      throwError(() => new ErrorAplicacion('No pudimos conectar con el servidor.', 'SIN_CONEXION')),
      of(RUTA_ANA),
    );
    crear();
    expect(avisos('alert')).toEqual(['No pudimos conectar con el servidor.']);

    pulsar('Reintentar');

    expect(avisos('alert')).toEqual([]);
    expect(elemento.querySelectorAll('app-parada-card').length).toBe(2);
  });

  it('«Actualizar» vuelve a pedir la ruta y descarta el aviso anterior', () => {
    cambiarEstado.execute.and.returnValue(of({ mensaje: 'Ruta iniciada.', data: ORDEN_EN_RUTA }));
    crear();
    pulsar('Iniciar ruta');

    pulsar('Actualizar');

    expect(obtenerRuta.execute).toHaveBeenCalledTimes(3);
    expect(avisos('status')).not.toContain('Ruta iniciada.');
  });

  it('a un usuario sin repartidor vinculado se lo explica y no pide ninguna ruta', () => {
    crear(USUARIO_ADMIN);

    expect(obtenerRuta.execute).not.toHaveBeenCalled();
    expect(elemento.textContent).toContain('Tu usuario no está vinculado a un repartidor');
    expect(boton('Actualizar')).toBeUndefined();
  });
});
