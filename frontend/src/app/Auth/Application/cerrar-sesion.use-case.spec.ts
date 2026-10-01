import { TestBed } from '@angular/core/testing';
import {
  crearSesionEnMemoria,
  USUARIO_CLIENTE,
} from '../Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { CerrarSesionUseCase } from './cerrar-sesion.use-case';
import { SESION_CONTRACT } from './contracts/sesion.contract';

describe('CerrarSesionUseCase', () => {
  it('olvida la sesión actual', () => {
    const sesion = crearSesionEnMemoria(USUARIO_CLIENTE);
    TestBed.configureTestingModule({
      providers: [CerrarSesionUseCase, { provide: SESION_CONTRACT, useValue: sesion }],
    });

    TestBed.inject(CerrarSesionUseCase).execute();

    expect(sesion.actual()).toBeNull();
  });
});
