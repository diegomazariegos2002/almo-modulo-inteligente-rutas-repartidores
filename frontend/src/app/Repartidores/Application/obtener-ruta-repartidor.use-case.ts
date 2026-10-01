import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { REPARTIDORES_REPOSITORY } from '../Domain/repartidores.repository';
import { Ruta } from '../Domain/ruta.entity';

@Injectable()
export class ObtenerRutaRepartidorUseCase {
  private readonly repositorio = inject(REPARTIDORES_REPOSITORY);

  /** Ruta actual de un repartidor, con las paradas en el orden que calculó el servidor. */
  execute(repartidorId: number): Observable<Ruta> {
    return this.repositorio.obtenerRuta(repartidorId);
  }
}
