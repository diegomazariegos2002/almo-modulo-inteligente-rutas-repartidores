import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { SESION_CONTRACT } from '../../Application/contracts/sesion.contract';
import { Permiso, PERMISOS } from '../../Domain/auth.models';
import { Usuario } from '../../Domain/usuario.entity';
import {
  crearSesionEnMemoria,
  USUARIO_ADMIN,
  USUARIO_CLIENTE,
  USUARIO_REPARTIDOR,
} from '../Angular/_fixtures/usuarios.fixtures';
import { permisoGuard } from './permiso.guard';

describe('permisoGuard', () => {
  function ejecutar(permiso: Permiso, usuario: Usuario | null): GuardResult {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria(usuario) },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      permisoGuard(permiso)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as GuardResult;
  }

  function urlDe(resultado: GuardResult): string {
    return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
  }

  it('deja pasar al cliente a crear órdenes', () => {
    expect(ejecutar(PERMISOS.ORDEN_CREAR, USUARIO_CLIENTE)).toBeTrue();
  });

  it('deja pasar a despacho al listado de repartidores', () => {
    expect(ejecutar(PERMISOS.REPARTIDOR_LISTAR, USUARIO_ADMIN)).toBeTrue();
  });

  it('envía a la página de acceso denegado al usuario que no lo tiene', () => {
    expect(urlDe(ejecutar(PERMISOS.ORDEN_CREAR, USUARIO_REPARTIDOR))).toBe('/sin-permiso');
  });

  it('tampoco deja pasar si no hay sesión', () => {
    expect(urlDe(ejecutar(PERMISOS.ORDEN_LISTAR, null))).toBe('/sin-permiso');
  });
});
