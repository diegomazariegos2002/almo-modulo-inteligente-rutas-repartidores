import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOGGER_CONTRACT, LoggerContract } from '../../Application/contracts/logger.contract';
import { ErrorAplicacion } from '../../Domain/error-aplicacion.entity';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let logger: jasmine.SpyObj<LoggerContract>;

  /** Lanza un GET y devuelve lo que el suscriptor recibe por el canal de error. */
  function capturarError(responder: () => void): unknown {
    let recibido: unknown;
    http.get('/api/ordenes').subscribe({ error: (error: unknown) => (recibido = error) });
    responder();
    return recibido;
  }

  beforeEach(() => {
    logger = jasmine.createSpyObj<LoggerContract>('LoggerContract', ['warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: LOGGER_CONTRACT, useValue: logger },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('deja pasar las respuestas correctas sin tocarlas', () => {
    let cuerpo: unknown;
    http.get('/api/ordenes').subscribe((respuesta) => (cuerpo = respuesta));

    backend.expectOne('/api/ordenes').flush({ data: [] });

    expect(cuerpo).toEqual({ data: [] });
  });

  it('convierte un error de la API en un ErrorAplicacion con mensaje en español', () => {
    const error = capturarError(() =>
      backend.expectOne('/api/ordenes').flush(
        {
          statusCode: 403,
          code: 'AUTH.PERMISO_DENEGADO',
          message: 'Forbidden resource',
          timestamp: '2026-09-30T18:00:00.000Z',
        },
        { status: 403, statusText: 'Forbidden' },
      ),
    );

    expect(error).toBeInstanceOf(ErrorAplicacion);
    expect((error as ErrorAplicacion).codigo).toBe('AUTH.PERMISO_DENEGADO');
    expect((error as ErrorAplicacion).message).toBe(
      'Tu usuario no tiene permiso para realizar esta acción.',
    );
  });

  it('no registra los errores de negocio (4xx)', () => {
    capturarError(() =>
      backend
        .expectOne('/api/ordenes')
        .flush(
          { statusCode: 404, code: 'RUTAS.ORDEN_NO_ENCONTRADA', message: 'No existe' },
          { status: 404, statusText: 'Not Found' },
        ),
    );

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('registra los fallos del servidor para poder diagnosticarlos', () => {
    const error = capturarError(() =>
      backend
        .expectOne('/api/ordenes')
        .flush('boom', { status: 500, statusText: 'Internal Server Error' }),
    );

    expect((error as ErrorAplicacion).codigo).toBe('DESCONOCIDO');
    expect(logger.error).toHaveBeenCalledOnceWith(
      'Falló GET /api/ordenes (HTTP 500)',
      jasmine.any(String),
    );
  });

  it('registra y traduce los fallos de red', () => {
    const error = capturarError(() =>
      backend.expectOne('/api/ordenes').error(new ProgressEvent('error')),
    );

    expect((error as ErrorAplicacion).codigo).toBe('SIN_CONEXION');
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
