import { inject, Injectable } from '@angular/core';
import { ResultadoEscritura } from '@shared/Domain/api.models';
import { Observable } from 'rxjs';
import { Orden } from '../Domain/orden.entity';
import { NuevaOrden } from '../Domain/orden.models';
import { ORDENES_REPOSITORY } from '../Domain/ordenes.repository';

@Injectable()
export class CrearOrdenUseCase {
  private readonly repositorio = inject(ORDENES_REPOSITORY);

  /**
   * Registra la orden. El servidor decide si la asigna a un repartidor o la deja en
   * cola; ambos casos son un resultado correcto, no un error.
   */
  execute(nueva: NuevaOrden): Observable<ResultadoEscritura<Orden>> {
    return this.repositorio.crear(nueva);
  }
}
