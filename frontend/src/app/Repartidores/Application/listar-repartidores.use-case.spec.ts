import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { REPARTIDORES_REPOSITORY, RepartidoresRepository } from '../Domain/repartidores.repository';
import { REPARTIDORES } from '../Infrastructure/Angular/_fixtures/repartidores.fixtures';
import { ListarRepartidoresUseCase } from './listar-repartidores.use-case';

describe('ListarRepartidoresUseCase', () => {
  it('devuelve los repartidores que entrega el repositorio', () => {
    const repositorio = jasmine.createSpyObj<RepartidoresRepository>('RepartidoresRepository', [
      'listar',
    ]);
    repositorio.listar.and.returnValue(of(REPARTIDORES));
    TestBed.configureTestingModule({
      providers: [
        ListarRepartidoresUseCase,
        { provide: REPARTIDORES_REPOSITORY, useValue: repositorio },
      ],
    });

    let emitido: unknown;
    TestBed.inject(ListarRepartidoresUseCase)
      .execute()
      .subscribe((valor) => (emitido = valor));

    expect(repositorio.listar).toHaveBeenCalledTimes(1);
    expect(emitido).toBe(REPARTIDORES);
  });
});
