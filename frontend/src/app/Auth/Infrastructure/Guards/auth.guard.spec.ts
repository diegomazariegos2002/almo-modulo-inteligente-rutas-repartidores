import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { SESION_CONTRACT, SesionContract } from '../../Application/contracts/sesion.contract';
import { Sesion } from '../../Domain/sesion.entity';
import { crearSesionEnMemoria, USUARIO_CLIENTE } from '../Angular/_fixtures/usuarios.fixtures';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function configurar(sesion: SesionContract): void {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SESION_CONTRACT, useValue: sesion }],
    });
  }

  function ejecutar(): GuardResult {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as GuardResult;
  }

  function urlDe(resultado: GuardResult): string {
    return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
  }

  it('deja pasar cuando hay una sesión vigente', () => {
    configurar(crearSesionEnMemoria(USUARIO_CLIENTE));

    expect(ejecutar()).toBeTrue();
  });

  it('envía al inicio de sesión cuando no hay sesión', () => {
    configurar(crearSesionEnMemoria());

    expect(urlDe(ejecutar())).toBe('/login');
  });

  it('cierra una sesión vencida y avisa del motivo en el inicio de sesión', () => {
    const sesion = crearSesionEnMemoria();
    sesion.guardar(new Sesion('token-vencido', new Date(Date.now() - 1000), USUARIO_CLIENTE));
    configurar(sesion);

    expect(urlDe(ejecutar())).toBe('/login?sesion=expirada');
    expect(sesion.actual()).toBeNull();
  });
});
