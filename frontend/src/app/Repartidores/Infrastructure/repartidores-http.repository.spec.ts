import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOGGER_CONTRACT } from '@shared/Application/contracts/logger.contract';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { errorInterceptor } from '@shared/Infrastructure/Interceptors/error.interceptor';
import { Repartidor } from '../Domain/repartidor.entity';
import { Ruta } from '../Domain/ruta.entity';
import { REPARTIDORES_PLAIN, RUTA_ANA_PLAIN } from './Angular/_fixtures/repartidores.fixtures';
import { RepartidoresHttpRepository } from './repartidores-http.repository';

describe('RepartidoresHttpRepository', () => {
  let repositorio: RepartidoresHttpRepository;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RepartidoresHttpRepository,
        // Con el interceptor real se comprueba el recorrido completo de un error.
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: LOGGER_CONTRACT, useValue: jasmine.createSpyObj('Logger', ['warn', 'error']) },
      ],
    });
    repositorio = TestBed.inject(RepartidoresHttpRepository);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('listar hace GET /api/repartidores y devuelve entidades', () => {
    let repartidores: Repartidor[] = [];
    repositorio.listar().subscribe((valor) => (repartidores = valor));

    const peticion = backend.expectOne('/api/repartidores');
    expect(peticion.request.method).toBe('GET');
    peticion.flush(REPARTIDORES_PLAIN);

    expect(repartidores.every((repartidor) => repartidor instanceof Repartidor)).toBeTrue();
    expect(repartidores.map((repartidor) => repartidor.nombre)).toEqual([
      'Ana López',
      'Bruno Castillo',
      'Carla Méndez',
    ]);
    expect(repartidores[0].paradasPendientes).toBe(2);
  });

  it('obtenerRuta hace GET a la ruta del repartidor y conserva el orden de las paradas', () => {
    let ruta: Ruta | undefined;
    repositorio.obtenerRuta(1).subscribe((valor) => (ruta = valor));

    const peticion = backend.expectOne('/api/repartidores/1/ruta');
    expect(peticion.request.method).toBe('GET');
    peticion.flush(RUTA_ANA_PLAIN);

    expect(ruta).toBeInstanceOf(Ruta);
    expect(ruta?.paradas.map((parada) => parada.secuencia)).toEqual([1, 2]);
    expect(ruta?.paradas[1].distanciaDesdeAnteriorKm).toBe(3.91);
  });

  it('traduce un repartidor inexistente (404) a un mensaje para el usuario', () => {
    let error: unknown;
    repositorio.obtenerRuta(99).subscribe({ error: (recibido: unknown) => (error = recibido) });

    backend.expectOne('/api/repartidores/99/ruta').flush(
      {
        statusCode: 404,
        code: 'RUTAS.REPARTIDOR_NO_ENCONTRADO',
        message: 'Repartidor no encontrado',
        timestamp: '2026-09-30T18:00:00.000Z',
      },
      { status: 404, statusText: 'Not Found' },
    );

    expect(error).toBeInstanceOf(ErrorAplicacion);
    expect((error as ErrorAplicacion).message).toBe('No encontramos al repartidor solicitado.');
  });
});
