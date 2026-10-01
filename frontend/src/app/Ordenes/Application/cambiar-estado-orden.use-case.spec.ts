import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ORDENES_REPOSITORY, OrdenesRepository } from '../Domain/ordenes.repository';
import { ORDEN_EN_RUTA } from '../Infrastructure/Angular/_fixtures/ordenes.fixtures';
import { CambiarEstadoOrdenUseCase } from './cambiar-estado-orden.use-case';

describe('CambiarEstadoOrdenUseCase', () => {
  it('pide al repositorio mover la orden al estado indicado', () => {
    const repositorio = jasmine.createSpyObj<OrdenesRepository>('OrdenesRepository', [
      'cambiarEstado',
    ]);
    const resultado = { mensaje: 'Ruta iniciada.', data: ORDEN_EN_RUTA };
    repositorio.cambiarEstado.and.returnValue(of(resultado));
    TestBed.configureTestingModule({
      providers: [
        CambiarEstadoOrdenUseCase,
        { provide: ORDENES_REPOSITORY, useValue: repositorio },
      ],
    });

    let emitido: unknown;
    TestBed.inject(CambiarEstadoOrdenUseCase)
      .execute('ORD-000002', 'EN_RUTA')
      .subscribe((valor) => (emitido = valor));

    expect(repositorio.cambiarEstado).toHaveBeenCalledOnceWith('ORD-000002', 'EN_RUTA');
    expect(emitido).toBe(resultado);
  });
});
