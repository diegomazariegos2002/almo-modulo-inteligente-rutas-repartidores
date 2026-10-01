import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Repartidor } from '../Domain/repartidor.entity';
import { REPARTIDORES_REPOSITORY } from '../Domain/repartidores.repository';

@Injectable()
export class ListarRepartidoresUseCase {
  private readonly repositorio = inject(REPARTIDORES_REPOSITORY);

  /** Repartidores con su estado, su carga y sus paradas pendientes, para la vista de despacho. */
  execute(): Observable<Repartidor[]> {
    return this.repositorio.listar();
  }
}
