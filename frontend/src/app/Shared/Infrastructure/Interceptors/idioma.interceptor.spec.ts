import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { idiomaInterceptor } from './idioma.interceptor';

describe('idiomaInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idiomaInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('pide a la API los mensajes en español', () => {
    http.get('/api/ordenes').subscribe();

    const peticion = backend.expectOne('/api/ordenes');
    expect(peticion.request.headers.get('Accept-Language')).toBe('es');
    peticion.flush({});
  });

  it('no toca las peticiones que no van a la API', () => {
    http.get('/favicon.svg').subscribe();

    const peticion = backend.expectOne('/favicon.svg');
    expect(peticion.request.headers.has('Accept-Language')).toBeFalse();
    peticion.flush({});
  });
});
