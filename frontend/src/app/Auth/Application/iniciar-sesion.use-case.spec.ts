import { TestBed } from '@angular/core/testing';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { of, throwError } from 'rxjs';
import { AUTH_REPOSITORY, AuthRepository } from '../Domain/auth.repository';
import {
  crearSesion,
  crearSesionEnMemoria,
  USUARIO_CLIENTE,
} from '../Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { SESION_CONTRACT, SesionContract } from './contracts/sesion.contract';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';

describe('IniciarSesionUseCase', () => {
  const credenciales = { correo: 'cliente@almo.test', password: 'secreta' };
  let repositorio: jasmine.SpyObj<AuthRepository>;
  let sesion: SesionContract;
  let useCase: IniciarSesionUseCase;

  beforeEach(() => {
    repositorio = jasmine.createSpyObj<AuthRepository>('AuthRepository', ['iniciarSesion']);
    sesion = crearSesionEnMemoria();

    TestBed.configureTestingModule({
      providers: [
        IniciarSesionUseCase,
        { provide: AUTH_REPOSITORY, useValue: repositorio },
        { provide: SESION_CONTRACT, useValue: sesion },
      ],
    });
    useCase = TestBed.inject(IniciarSesionUseCase);
  });

  it('autentica con el repositorio y guarda la sesión recibida', () => {
    const nueva = crearSesion(USUARIO_CLIENTE);
    repositorio.iniciarSesion.and.returnValue(of(nueva));

    let emitida: unknown;
    useCase.execute(credenciales).subscribe((resultado) => (emitida = resultado));

    expect(repositorio.iniciarSesion).toHaveBeenCalledOnceWith(credenciales);
    expect(emitida).toBe(nueva);
    expect(sesion.actual()).toBe(nueva);
  });

  it('no guarda ninguna sesión si las credenciales se rechazan', () => {
    const rechazo = new ErrorAplicacion('Credenciales incorrectas.', 'AUTH.CREDENCIALES_INVALIDAS');
    repositorio.iniciarSesion.and.returnValue(throwError(() => rechazo));

    let error: unknown;
    useCase.execute(credenciales).subscribe({ error: (recibido: unknown) => (error = recibido) });

    expect(error).toBe(rechazo);
    expect(sesion.actual()).toBeNull();
  });
});
