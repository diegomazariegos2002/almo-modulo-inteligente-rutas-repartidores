import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NuevaOrden } from '../Domain/orden.models';
import { ORDENES_REPOSITORY, OrdenesRepository } from '../Domain/ordenes.repository';
import { ORDEN_ASIGNADA } from '../Infrastructure/Angular/_fixtures/ordenes.fixtures';
import { CrearOrdenUseCase } from './crear-orden.use-case';

describe('CrearOrdenUseCase', () => {
  it('envía la orden al repositorio y devuelve su resultado, con el mensaje del servidor', () => {
    const repositorio = jasmine.createSpyObj<OrdenesRepository>('OrdenesRepository', ['crear']);
    const resultado = { mensaje: 'Orden ORD-000003 asignada a Ana López.', data: ORDEN_ASIGNADA };
    repositorio.crear.and.returnValue(of(resultado));
    TestBed.configureTestingModule({
      providers: [CrearOrdenUseCase, { provide: ORDENES_REPOSITORY, useValue: repositorio }],
    });
    const nueva: NuevaOrden = { lat: 14.6229, lng: -90.5155, peso: 4.5 };

    let emitido: unknown;
    TestBed.inject(CrearOrdenUseCase)
      .execute(nueva)
      .subscribe((valor) => (emitido = valor));

    expect(repositorio.crear).toHaveBeenCalledOnceWith(nueva);
    expect(emitido).toBe(resultado);
  });
});
