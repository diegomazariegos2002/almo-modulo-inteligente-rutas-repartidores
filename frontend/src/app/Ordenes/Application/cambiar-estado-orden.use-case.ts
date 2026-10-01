import { inject, Injectable } from '@angular/core';
import { ResultadoEscritura } from '@shared/Domain/api.models';
import { Observable } from 'rxjs';
import { Orden } from '../Domain/orden.entity';
import { EstadoDestino } from '../Domain/orden.models';
import { ORDENES_REPOSITORY } from '../Domain/ordenes.repository';

@Injectable()
export class CambiarEstadoOrdenUseCase {
  private readonly repositorio = inject(ORDENES_REPOSITORY);

  /**
   * Avanza una orden desde la ruta del repartidor. Con `EN_RUTA` registra la salida a
   * ruta (afecta a todas sus paradas); con `ENTREGADA` cierra esa parada.
   */
  execute(folio: string, estado: EstadoDestino): Observable<ResultadoEscritura<Orden>> {
    return this.repositorio.cambiarEstado(folio, estado);
  }
}
