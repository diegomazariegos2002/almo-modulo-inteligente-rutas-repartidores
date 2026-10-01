import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FiltroOrdenes } from '../Domain/orden.models';
import { ORDENES_REPOSITORY, OrdenesRepository } from '../Domain/ordenes.repository';
import { PAGINA_ORDENES } from '../Infrastructure/Angular/_fixtures/ordenes.fixtures';
import { ListarOrdenesUseCase } from './listar-ordenes.use-case';

describe('ListarOrdenesUseCase', () => {
  it('pide al repositorio la página que describe el filtro', () => {
    const repositorio = jasmine.createSpyObj<OrdenesRepository>('OrdenesRepository', ['listar']);
    repositorio.listar.and.returnValue(of(PAGINA_ORDENES));
    TestBed.configureTestingModule({
      providers: [ListarOrdenesUseCase, { provide: ORDENES_REPOSITORY, useValue: repositorio }],
    });
    const filtro: FiltroOrdenes = { estado: 'ASIGNADA', page: 2, limit: 5 };

    let emitido: unknown;
    TestBed.inject(ListarOrdenesUseCase)
      .execute(filtro)
      .subscribe((valor) => (emitido = valor));

    expect(repositorio.listar).toHaveBeenCalledOnceWith(filtro);
    expect(emitido).toBe(PAGINA_ORDENES);
  });
});
