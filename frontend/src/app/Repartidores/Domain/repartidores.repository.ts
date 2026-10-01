import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Repartidor } from './repartidor.entity';
import { Ruta } from './ruta.entity';

export interface RepartidoresRepository {
  /** Todos los repartidores con su carga y sus paradas pendientes (vista de despacho). */
  listar(): Observable<Repartidor[]>;

  /** Ruta optimizada de un repartidor. Una ruta sin paradas es un resultado válido. */
  obtenerRuta(repartidorId: number): Observable<Ruta>;
}

export const REPARTIDORES_REPOSITORY = new InjectionToken<RepartidoresRepository>(
  'RepartidoresRepository',
);
