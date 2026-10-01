import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOGGER_CONTRACT } from '@shared/Application/contracts/logger.contract';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { errorInterceptor } from '@shared/Infrastructure/Interceptors/error.interceptor';
import { PERMISOS } from '../Domain/auth.models';
import { Sesion } from '../Domain/sesion.entity';
import { USUARIO_CLIENTE_PLAIN } from './Angular/_fixtures/usuarios.fixtures';
import { AuthHttpRepository } from './auth-http.repository';

describe('AuthHttpRepository', () => {
  const credenciales = { correo: 'cliente@almo.test', password: 'secreta' };
  let repositorio: AuthHttpRepository;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthHttpRepository,
        // Con el interceptor real se comprueba el recorrido completo de un error.
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: LOGGER_CONTRACT, useValue: jasmine.createSpyObj('Logger', ['warn', 'error']) },
      ],
    });
    repositorio = TestBed.inject(AuthHttpRepository);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('hace POST /api/auth/login con las credenciales y devuelve la sesión', () => {
    let sesion: Sesion | undefined;
    repositorio.iniciarSesion(credenciales).subscribe((valor) => (sesion = valor));

    const peticion = backend.expectOne('/api/auth/login');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(credenciales);
    peticion.flush({
      accessToken: 'eyJhbGciOi',
      tokenType: 'Bearer',
      expiresIn: 28800,
      usuario: USUARIO_CLIENTE_PLAIN,
    });

    expect(sesion).toBeInstanceOf(Sesion);
    expect(sesion?.accessToken).toBe('eyJhbGciOi');
    expect(sesion?.usuario.nombre).toBe('Cliente Demo');
    expect(sesion?.usuario.tienePermiso(PERMISOS.ORDEN_CREAR)).toBeTrue();
  });

  it('convierte la vigencia en segundos (expiresIn) en la fecha de expiración', () => {
    const antes = Date.now();
    let sesion: Sesion | undefined;
    repositorio.iniciarSesion(credenciales).subscribe((valor) => (sesion = valor));

    backend.expectOne('/api/auth/login').flush({
      accessToken: 'eyJhbGciOi',
      tokenType: 'Bearer',
      expiresIn: 3600,
      usuario: USUARIO_CLIENTE_PLAIN,
    });

    const expiraEn = sesion?.expiraEn.getTime() ?? 0;
    expect(expiraEn).toBeGreaterThanOrEqual(antes + 3600 * 1000);
    expect(expiraEn).toBeLessThanOrEqual(Date.now() + 3600 * 1000);
  });

  it('traduce unas credenciales rechazadas (401) a un mensaje para el usuario', () => {
    let error: unknown;
    repositorio
      .iniciarSesion(credenciales)
      .subscribe({ error: (recibido: unknown) => (error = recibido) });

    backend.expectOne('/api/auth/login').flush(
      {
        statusCode: 401,
        code: 'AUTH.CREDENCIALES_INVALIDAS',
        message: 'Credenciales inválidas',
        timestamp: '2026-09-30T18:00:00.000Z',
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(error).toBeInstanceOf(ErrorAplicacion);
    expect((error as ErrorAplicacion).message).toBe('El correo o la contraseña no son correctos.');
  });
});
