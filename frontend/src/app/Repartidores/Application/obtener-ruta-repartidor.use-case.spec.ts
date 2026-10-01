import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { REPARTIDORES_REPOSITORY, RepartidoresRepository } from '../Domain/repartidores.repository';
import { RUTA_ANA } from '../Infrastructure/Angular/_fixtures/repartidores.fixtures';
import { ObtenerRutaRepartidorUseCase } from './obtener-ruta-repartidor.use-case';

describe('ObtenerRutaRepartidorUseCase', () => {
  it('pide al repositorio la ruta del repartidor indicado', () => {
    const repositorio = jasmine.createSpyObj<RepartidoresRepository>('RepartidoresRepository', [
      'obtenerRuta',
    ]);
    repositorio.obtenerRuta.and.returnValue(of(RUTA_ANA));
    TestBed.configureTestingModule({
      providers: [
        ObtenerRutaRepartidorUseCase,
        { provide: REPARTIDORES_REPOSITORY, useValue: repositorio },
      ],
    });

    let emitido: unknown;
    TestBed.inject(ObtenerRutaRepartidorUseCase)
      .execute(1)
      .subscribe((valor) => (emitido = valor));

    expect(repositorio.obtenerRuta).toHaveBeenCalledOnceWith(1);
    expect(emitido).toBe(RUTA_ANA);
  });
});
