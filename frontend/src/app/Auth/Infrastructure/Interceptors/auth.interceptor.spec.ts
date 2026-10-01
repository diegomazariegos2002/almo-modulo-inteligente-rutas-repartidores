import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SESION_CONTRACT, SesionContract } from '../../Application/contracts/sesion.contract';
import { Usuario } from '../../Domain/usuario.entity';
import { crearSesionEnMemoria, USUARIO_REPARTIDOR } from '../Angular/_fixtures/usuarios.fixtures';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let sesion: SesionContract;

  function configurar(usuario: Usuario | null): void {
    sesion = crearSesionEnMemoria(usuario);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SESION_CONTRACT, useValue: sesion },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  afterEach(() => backend.verify());

  it('agrega el token Bearer a las llamadas a la API', () => {
    configurar(USUARIO_REPARTIDOR);

    http.get('/api/ordenes').subscribe();

    const peticion = backend.expectOne('/api/ordenes');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush({});
  });

  it('no agrega cabecera cuando no hay sesión, como en el propio login', () => {
    configurar(null);

    http.post('/api/auth/login', {}).subscribe();

    const peticion = backend.expectOne('/api/auth/login');
    expect(peticion.request.headers.has('Authorization')).toBeFalse();
    peticion.flush({});
  });

  it('no envía el token a direcciones que no son de la API', () => {
    configurar(USUARIO_REPARTIDOR);

    http.get('/assets/config.json').subscribe();

    const peticion = backend.expectOne('/assets/config.json');
    expect(peticion.request.headers.has('Authorization')).toBeFalse();
    peticion.flush({});
  });

  it('ante un 401 cierra la sesión, vuelve al login y propaga el error', () => {
    configurar(USUARIO_REPARTIDOR);
    let error: unknown;

    http.get('/api/ordenes').subscribe({ error: (recibido: unknown) => (error = recibido) });
    backend
      .expectOne('/api/ordenes')
      .flush({ code: 'AUTH.NO_AUTENTICADO' }, { status: 401, statusText: 'Unauthorized' });

    expect(sesion.actual()).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login'], {
      queryParams: { sesion: 'expirada' },
    });
    expect(error).toBeDefined();
  });

  it('conserva la sesión ante cualquier otro error', () => {
    configurar(USUARIO_REPARTIDOR);

    http.get('/api/ordenes').subscribe({ error: () => undefined });
    backend
      .expectOne('/api/ordenes')
      .flush({ code: 'AUTH.PERMISO_DENEGADO' }, { status: 403, statusText: 'Forbidden' });

    expect(sesion.actual()).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
