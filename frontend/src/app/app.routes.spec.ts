import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CerrarSesionUseCase } from '@auth/Application/cerrar-sesion.use-case';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { IniciarSesionUseCase } from '@auth/Application/iniciar-sesion.use-case';
import { Usuario } from '@auth/Domain/usuario.entity';
import {
  crearSesionEnMemoria,
  USUARIO_ADMIN,
  USUARIO_CLIENTE,
  USUARIO_REPARTIDOR,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { CambiarEstadoOrdenUseCase } from '@ordenes/Application/cambiar-estado-orden.use-case';
import { CrearOrdenUseCase } from '@ordenes/Application/crear-orden.use-case';
import { ListarOrdenesUseCase } from '@ordenes/Application/listar-ordenes.use-case';
import { ListarRepartidoresUseCase } from '@repartidores/Application/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from '@repartidores/Application/obtener-ruta-repartidor.use-case';
import { NEVER } from 'rxjs';
import { routes } from './app.routes';

describe('Rutas de la aplicación', () => {
  /** Casos de uso que nunca responden: aquí solo interesa a qué pantalla se llega. */
  const casoDeUsoInerte = { execute: () => NEVER };

  async function navegar(url: string, usuario: Usuario | null): Promise<string> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria(usuario) },
        CerrarSesionUseCase,
        { provide: IniciarSesionUseCase, useValue: casoDeUsoInerte },
        { provide: CrearOrdenUseCase, useValue: casoDeUsoInerte },
        { provide: ListarOrdenesUseCase, useValue: casoDeUsoInerte },
        { provide: CambiarEstadoOrdenUseCase, useValue: casoDeUsoInerte },
        { provide: ListarRepartidoresUseCase, useValue: casoDeUsoInerte },
        { provide: ObtenerRutaRepartidorUseCase, useValue: casoDeUsoInerte },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  const contenido = () => (document.querySelector('app-shell main')?.textContent ?? '').trim();

  describe('sin sesión', () => {
    it('la raíz lleva al inicio de sesión', async () => {
      expect(await navegar('/', null)).toBe('/login');
    });

    it('una pantalla protegida lleva al inicio de sesión', async () => {
      expect(await navegar('/ordenes', null)).toBe('/login');
    });
  });

  describe('pantalla inicial según los permisos', () => {
    it('el cliente empieza creando una orden', async () => {
      expect(await navegar('/', USUARIO_CLIENTE)).toBe('/ordenes/nueva');
    });

    it('el repartidor empieza en su ruta', async () => {
      expect(await navegar('/', USUARIO_REPARTIDOR)).toBe('/mi-ruta');
    });

    it('despacho empieza en la lista de repartidores', async () => {
      expect(await navegar('/', USUARIO_ADMIN)).toBe('/despacho');
    });

    it('un usuario sin permisos llega a la página de acceso denegado', async () => {
      const sinPermisos = Usuario.fromPlain({ ...USUARIO_CLIENTE.toPlain(), permisos: [] });

      expect(await navegar('/', sinPermisos)).toBe('/sin-permiso');
    });
  });

  describe('permisos por pantalla', () => {
    it('todos los roles pueden ver el listado de órdenes', async () => {
      expect(await navegar('/ordenes', USUARIO_REPARTIDOR)).toBe('/ordenes');
    });

    it('un repartidor no puede crear órdenes', async () => {
      expect(await navegar('/ordenes/nueva', USUARIO_REPARTIDOR)).toBe('/sin-permiso');
      expect(contenido()).toContain('No tienes acceso a esta sección');
    });

    it('un cliente no puede entrar a despacho ni a una ruta', async () => {
      expect(await navegar('/despacho', USUARIO_CLIENTE)).toBe('/sin-permiso');
      TestBed.resetTestingModule();
      expect(await navegar('/mi-ruta', USUARIO_CLIENTE)).toBe('/sin-permiso');
    });
  });

  it('una dirección desconocida muestra la página 404 dentro de la aplicación', async () => {
    expect(await navegar('/no-existe', USUARIO_CLIENTE)).toBe('/no-existe');
    expect(contenido()).toContain('Error 404');
    expect(contenido()).toContain('No encontramos esta página');
  });
});
