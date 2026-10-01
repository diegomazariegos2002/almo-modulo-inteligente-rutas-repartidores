import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOGGER_CONTRACT } from '@shared/Application/contracts/logger.contract';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { errorInterceptor } from '@shared/Infrastructure/Interceptors/error.interceptor';
import { Orden } from '../Domain/orden.entity';
import {
  ORDEN_ASIGNADA_PLAIN,
  ORDEN_EN_RUTA_PLAIN,
  ORDENES_SEED_PLAIN,
} from './Angular/_fixtures/ordenes.fixtures';
import { OrdenesHttpRepository } from './ordenes-http.repository';

describe('OrdenesHttpRepository', () => {
  let repositorio: OrdenesHttpRepository;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdenesHttpRepository,
        // Con el interceptor real se comprueba el recorrido completo de un error.
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: LOGGER_CONTRACT, useValue: jasmine.createSpyObj('Logger', ['warn', 'error']) },
      ],
    });
    repositorio = TestBed.inject(OrdenesHttpRepository);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  describe('crear', () => {
    const nueva = { lat: 14.6229, lng: -90.5155, peso: 4.5, direccion: 'Zona 4' };

    it('hace POST /api/ordenes y convierte el sobre en un resultado con la entidad', () => {
      let resultado: { mensaje: string; data: Orden } | undefined;
      repositorio.crear(nueva).subscribe((valor) => (resultado = valor));

      const peticion = backend.expectOne('/api/ordenes');
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toEqual(nueva);
      peticion.flush(
        {
          statusCode: 201,
          code: 'CREATED',
          message: 'Orden ORD-000003 asignada a Ana López.',
          data: ORDEN_ASIGNADA_PLAIN,
        },
        { status: 201, statusText: 'Created' },
      );

      expect(resultado?.mensaje).toBe('Orden ORD-000003 asignada a Ana López.');
      expect(resultado?.data).toBeInstanceOf(Orden);
      expect(resultado?.data.repartidor?.nombre).toBe('Ana López');
    });

    it('entrega los errores por campo cuando el servidor rechaza la orden', () => {
      let error: unknown;
      repositorio.crear(nueva).subscribe({ error: (recibido: unknown) => (error = recibido) });

      backend.expectOne('/api/ordenes').flush(
        {
          statusCode: 400,
          code: 'VALIDACION.ENTRADA_INVALIDA',
          message: 'Los datos enviados no son válidos.',
          timestamp: '2026-09-30T18:00:00.000Z',
          details: [{ campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' }],
        },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(error).toBeInstanceOf(ErrorAplicacion);
      expect((error as ErrorAplicacion).detalles).toEqual([
        { campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' },
      ]);
    });
  });

  describe('listar', () => {
    const meta = {
      total: 5,
      page: 1,
      limit: 5,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    it('envía page y limit, y convierte cada elemento en una entidad', () => {
      let folios: string[] = [];
      let total = 0;
      repositorio.listar({ estado: null, page: 1, limit: 5 }).subscribe((pagina) => {
        folios = pagina.data.map((orden) => orden.folio);
        total = pagina.meta.total;
        expect(pagina.data.every((orden) => orden instanceof Orden)).toBeTrue();
      });

      const peticion = backend.expectOne((req) => req.url === '/api/ordenes');
      expect(peticion.request.method).toBe('GET');
      expect(peticion.request.params.get('page')).toBe('1');
      expect(peticion.request.params.get('limit')).toBe('5');
      expect(peticion.request.params.has('estado')).toBeFalse();
      peticion.flush({ data: ORDENES_SEED_PLAIN, meta });

      expect(folios).toEqual([
        'ORD-000005',
        'ORD-000004',
        'ORD-000003',
        'ORD-000002',
        'ORD-000001',
      ]);
      expect(total).toBe(5);
    });

    it('agrega el estado a la consulta solo cuando hay filtro', () => {
      repositorio.listar({ estado: 'EN_RUTA', page: 2, limit: 10 }).subscribe();

      const peticion = backend.expectOne((req) => req.url === '/api/ordenes');
      expect(peticion.request.params.get('estado')).toBe('EN_RUTA');
      expect(peticion.request.params.get('page')).toBe('2');
      peticion.flush({ data: [], meta: { ...meta, total: 0, page: 2, limit: 10 } });
    });
  });

  describe('cambiarEstado', () => {
    it('hace PATCH al estado de la orden y devuelve la orden actualizada', () => {
      let resultado: { mensaje: string; data: Orden } | undefined;
      repositorio.cambiarEstado('ORD-000002', 'EN_RUTA').subscribe((valor) => (resultado = valor));

      const peticion = backend.expectOne('/api/ordenes/ORD-000002/estado');
      expect(peticion.request.method).toBe('PATCH');
      expect(peticion.request.body).toEqual({ estado: 'EN_RUTA' });
      peticion.flush({
        statusCode: 200,
        code: 'OK',
        message: 'Carla Méndez salió a ruta.',
        data: ORDEN_EN_RUTA_PLAIN,
      });

      expect(resultado?.mensaje).toBe('Carla Méndez salió a ruta.');
      expect(resultado?.data.estado).toBe('EN_RUTA');
    });

    it('traduce un cambio de estado inválido (409) a un mensaje para el usuario', () => {
      let error: unknown;
      repositorio
        .cambiarEstado('ORD-000001', 'EN_RUTA')
        .subscribe({ error: (recibido: unknown) => (error = recibido) });

      backend.expectOne('/api/ordenes/ORD-000001/estado').flush(
        {
          statusCode: 409,
          code: 'RUTAS.TRANSICION_ESTADO_INVALIDA',
          message: 'Transición inválida',
          timestamp: '2026-09-30T18:00:00.000Z',
        },
        { status: 409, statusText: 'Conflict' },
      );

      expect((error as ErrorAplicacion).codigo).toBe('RUTAS.TRANSICION_ESTADO_INVALIDA');
      expect((error as ErrorAplicacion).message).toBe(
        'La orden ya cambió de estado. Actualiza la pantalla e inténtalo de nuevo.',
      );
    });
  });
});
