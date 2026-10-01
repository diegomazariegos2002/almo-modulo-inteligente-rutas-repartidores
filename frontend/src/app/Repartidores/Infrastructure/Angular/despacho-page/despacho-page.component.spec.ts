import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { of, Subject, throwError } from 'rxjs';
import { ListarRepartidoresUseCase } from '../../../Application/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from '../../../Application/obtener-ruta-repartidor.use-case';
import { Ruta } from '../../../Domain/ruta.entity';
import { REPARTIDORES, RUTA_ANA, RUTA_CARLA } from '../_fixtures/repartidores.fixtures';
import { DespachoPageComponent } from './despacho-page.component';

describe('DespachoPageComponent', () => {
  let fixture: ComponentFixture<DespachoPageComponent>;
  let elemento: HTMLElement;
  let listar: jasmine.SpyObj<ListarRepartidoresUseCase>;
  let obtenerRuta: jasmine.SpyObj<ObtenerRutaRepartidorUseCase>;

  function crear(): void {
    TestBed.configureTestingModule({
      imports: [DespachoPageComponent],
      providers: [
        { provide: ListarRepartidoresUseCase, useValue: listar },
        { provide: ObtenerRutaRepartidorUseCase, useValue: obtenerRuta },
      ],
    });
    fixture = TestBed.createComponent(DespachoPageComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  const tarjetas = () => elemento.querySelectorAll('app-repartidor-card');

  /** Pulsa «Ver ruta» en la tarjeta del repartidor que ocupa esa posición. */
  function verRuta(posicion: number): void {
    (tarjetas()[posicion].querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function pulsar(texto: string): void {
    Array.from(elemento.querySelectorAll('button'))
      .find((boton) => boton.textContent?.includes(texto))
      ?.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    listar = jasmine.createSpyObj<ListarRepartidoresUseCase>('ListarRepartidores', ['execute']);
    obtenerRuta = jasmine.createSpyObj<ObtenerRutaRepartidorUseCase>('ObtenerRuta', ['execute']);
    listar.execute.and.returnValue(of(REPARTIDORES));
    obtenerRuta.execute.and.returnValue(of(RUTA_ANA));
  });

  it('lista los repartidores y, hasta elegir uno, invita a hacerlo', () => {
    crear();

    expect(tarjetas().length).toBe(3);
    expect(elemento.textContent).toContain('Elige un repartidor');
    expect(obtenerRuta.execute).not.toHaveBeenCalled();
  });

  it('al elegir un repartidor muestra su ruta y lo marca como seleccionado', () => {
    crear();

    verRuta(0);

    expect(obtenerRuta.execute).toHaveBeenCalledOnceWith(1);
    expect(elemento.querySelectorAll('app-parada-card').length).toBe(2);
    expect(tarjetas()[0].querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
    expect(tarjetas()[1].querySelector('button')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('la ruta es de solo lectura: no ofrece iniciarla ni entregar paradas', () => {
    obtenerRuta.execute.and.returnValue(of(RUTA_CARLA));
    crear();

    verRuta(2);

    const acciones = elemento.querySelectorAll('app-ruta-detalle button');
    expect(elemento.querySelector('app-ruta-detalle')?.textContent).toContain('Carla Méndez');
    expect(acciones.length).toBe(0);
  });

  it('si se elige otro repartidor antes de que llegue la ruta, descarta la anterior', () => {
    const rutaDeAna = new Subject<Ruta>();
    obtenerRuta.execute.and.returnValues(rutaDeAna, of(RUTA_CARLA));
    crear();

    verRuta(0);
    verRuta(2);
    rutaDeAna.next(RUTA_ANA);
    fixture.detectChanges();

    expect(elemento.querySelector('app-ruta-detalle')?.textContent).toContain('Carla Méndez');
  });

  it('muestra el error de la lista con la opción de reintentar', () => {
    listar.execute.and.returnValues(
      throwError(() => new ErrorAplicacion('No pudimos conectar con el servidor.', 'SIN_CONEXION')),
      of(REPARTIDORES),
    );
    crear();
    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos conectar con el servidor.',
    );

    pulsar('Reintentar');

    expect(tarjetas().length).toBe(3);
  });

  it('muestra el error de la ruta sin perder la lista de repartidores', () => {
    obtenerRuta.execute.and.returnValue(
      throwError(
        () =>
          new ErrorAplicacion(
            'No encontramos al repartidor solicitado.',
            'RUTAS.REPARTIDOR_NO_ENCONTRADO',
          ),
      ),
    );
    crear();

    verRuta(1);

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'No encontramos al repartidor solicitado.',
    );
    expect(tarjetas().length).toBe(3);
  });

  it('«Actualizar» vuelve a pedir la lista y la ruta del repartidor elegido', () => {
    crear();
    verRuta(0);

    pulsar('Actualizar');

    expect(listar.execute).toHaveBeenCalledTimes(2);
    expect(obtenerRuta.execute).toHaveBeenCalledTimes(2);
    expect(obtenerRuta.execute.calls.mostRecent().args).toEqual([1]);
  });

  it('avisa cuando no hay repartidores registrados', () => {
    listar.execute.and.returnValue(of([]));
    crear();

    expect(elemento.textContent).toContain('No hay repartidores registrados');
  });
});
