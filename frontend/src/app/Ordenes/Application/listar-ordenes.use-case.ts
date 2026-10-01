import { inject, Injectable } from '@angular/core';
import { Pagina } from '@shared/Domain/api.models';
import { Observable } from 'rxjs';
import { Orden } from '../Domain/orden.entity';
import { FiltroOrdenes } from '../Domain/orden.models';
import { ORDENES_REPOSITORY } from '../Domain/ordenes.repository';

@Injectable()
export class ListarOrdenesUseCase {
  private readonly repositorio = inject(ORDENES_REPOSITORY);

  /** Una página de las órdenes que el usuario puede ver, filtradas por estado si se indica. */
  execute(filtro: FiltroOrdenes): Observable<Pagina<Orden>> {
    return this.repositorio.listar(filtro);
  }
}
