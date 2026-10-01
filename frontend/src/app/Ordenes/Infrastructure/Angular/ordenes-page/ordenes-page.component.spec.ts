import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { Usuario } from '@auth/Domain/usuario.entity';
import {
  crearSesionEnMemoria,
  USUARIO_CLIENTE,
  USUARIO_REPARTIDOR,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { Pagina } from '@shared/Domain/api.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { of, Subject, throwError } from 'rxjs';
import { ListarOrdenesUseCase } from '../../../Application/listar-ordenes.use-case';
import { Orden } from '../../../Domain/orden.entity';
import { ORDEN_EN_RUTA, PAGINA_ORDENES, PAGINA_ORDENES_VACIA } from '../_fixtures/ordenes.fixtures';
import { OrdenesPageComponent } from './ordenes-page.component';

describe('OrdenesPageComponent', () => {
  let fixture: ComponentFixture<OrdenesPageComponent>;
  let elemento: HTMLElement;
  let listar: jasmine.SpyObj<ListarOrdenesUseCase>;

  /** Página de 12 órdenes repartidas en 3 páginas, para probar la paginación. */
  const PAGINA_1_DE_3: Pagina<Orden> = {
    data: PAGINA_ORDENES.data,
    meta: {
      total: 12,
      page: 1,
      limit: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  };

  function crear(usuario: Usuario = USUARIO_CLIENTE): void {
    TestBed.configureTestingModule({
      imports: [OrdenesPageComponent],
      providers: [
        provideRouter([]),
        { provide: ListarOrdenesUseCase, useValue: listar },
        { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria(usuario) },
      ],
    });
    fixture = TestBed.createComponent(OrdenesPageComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  const tarjetas = () => elemento.querySelectorAll('app-orden-card');
  const radios = () => elemento.querySelectorAll<HTMLInputElement>('input[type=radio]');

  function pulsar(texto: string): void {
    const boton = Array.from(elemento.querySelectorAll<HTMLElement>('button, a')).find(
      (candidato) =>
        candidato.textContent?.includes(texto) || candidato.getAttribute('aria-label') === texto,
    );
    boton?.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    listar = jasmine.createSpyObj<ListarOrdenesUseCase>('ListarOrdenesUseCase', ['execute']);
    listar.execute.and.returnValue(of(PAGINA_1_DE_3));
  });

  it('pide la primera página sin filtro y muestra una tarjeta por orden', () => {
    crear();

    expect(listar.execute).toHaveBeenCalledOnceWith({ estado: null, page: 1, limit: 5 });
    expect(tarjetas().length).toBe(5);
    expect(elemento.textContent).toContain('1–5 de 12');
  });

  it('muestra un indicador de carga hasta que llega la primera respuesta', () => {
    const respuesta = new Subject<Pagina<Orden>>();
    listar.execute.and.returnValue(respuesta);
    crear();
    expect(elemento.querySelector('app-spinner')).not.toBeNull();

    respuesta.next(PAGINA_ORDENES);
    fixture.detectChanges();

    expect(elemento.querySelector('app-spinner')).toBeNull();
    expect(tarjetas().length).toBe(5);
  });

  it('al filtrar por estado vuelve a la primera página con ese estado', () => {
    crear();
    pulsar('Página siguiente');

    radios()[3].click(); // En Ruta
    fixture.detectChanges();

    expect(listar.execute.calls.mostRecent().args[0]).toEqual({
      estado: 'EN_RUTA',
      page: 1,
      limit: 5,
    });
  });

  it('al cambiar de página conserva el filtro y el tamaño', () => {
    crear();
    radios()[2].click(); // Asignada
    fixture.detectChanges();

    pulsar('Página siguiente');

    expect(listar.execute.calls.mostRecent().args[0]).toEqual({
      estado: 'ASIGNADA',
      page: 2,
      limit: 5,
    });
  });

  it('al cambiar el tamaño de página vuelve a la primera', () => {
    crear();
    pulsar('Página siguiente');
    const selector = elemento.querySelector('app-paginador select') as HTMLSelectElement;

    selector.value = '10';
    selector.dispatchEvent(new Event('change'));

    expect(listar.execute.calls.mostRecent().args[0]).toEqual({ estado: null, page: 1, limit: 10 });
  });

  it('ignora la respuesta de una consulta anterior si llega después de la más reciente', () => {
    const primera = new Subject<Pagina<Orden>>();
    listar.execute.and.returnValues(primera, of({ ...PAGINA_ORDENES, data: [ORDEN_EN_RUTA] }));
    crear();

    radios()[3].click(); // la segunda consulta responde de inmediato
    primera.next(PAGINA_ORDENES); // la primera llega tarde
    fixture.detectChanges();

    expect(tarjetas().length).toBe(1);
  });

  it('muestra el error con la opción de reintentar', () => {
    listar.execute.and.returnValues(
      throwError(() => new ErrorAplicacion('No pudimos conectar con el servidor.', 'SIN_CONEXION')),
      of(PAGINA_ORDENES),
    );
    crear();
    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos conectar con el servidor.',
    );

    pulsar('Reintentar');

    expect(listar.execute).toHaveBeenCalledTimes(2);
    expect(elemento.querySelector('[role="alert"]')).toBeNull();
    expect(tarjetas().length).toBe(5);
  });

  it('sin órdenes invita a crear la primera a quien puede crearlas', () => {
    listar.execute.and.returnValue(of(PAGINA_ORDENES_VACIA));
    crear(USUARIO_CLIENTE);

    expect(elemento.textContent).toContain('Aún no hay órdenes');
    expect(elemento.querySelector('a[href="/ordenes/nueva"]')).not.toBeNull();
    expect(elemento.querySelector('app-paginador')).toBeNull();
  });

  it('sin órdenes no ofrece crearlas a quien no tiene ese permiso', () => {
    listar.execute.and.returnValue(of(PAGINA_ORDENES_VACIA));
    crear(USUARIO_REPARTIDOR);

    expect(elemento.textContent).toContain('Aún no hay órdenes');
    expect(elemento.querySelector('a[href="/ordenes/nueva"]')).toBeNull();
  });

  it('con un filtro sin resultados ofrece volver a ver todas', () => {
    crear();
    listar.execute.and.returnValue(of(PAGINA_ORDENES_VACIA));
    radios()[1].click(); // Pendiente de Asignación
    fixture.detectChanges();
    expect(elemento.textContent).toContain('No hay órdenes en este estado');

    listar.execute.and.returnValue(of(PAGINA_ORDENES));
    pulsar('Ver todas');

    expect(listar.execute.calls.mostRecent().args[0].estado).toBeNull();
    expect(tarjetas().length).toBe(5);
  });

  it('si la página pedida queda fuera de rango ofrece volver a la primera', () => {
    listar.execute.and.returnValue(
      of({ data: [], meta: { ...PAGINA_1_DE_3.meta, page: 4, hasNextPage: false } }),
    );
    crear();
    expect(elemento.textContent).toContain('Esta página ya no tiene órdenes');

    pulsar('Ir a la primera página');

    expect(listar.execute.calls.mostRecent().args[0].page).toBe(1);
  });
});
