import { InjectionToken } from '@angular/core';
import { Pagina, ResultadoEscritura } from '@shared/Domain/api.models';
import { Observable } from 'rxjs';
import { Orden } from './orden.entity';
import { EstadoDestino, FiltroOrdenes, NuevaOrden } from './orden.models';

export interface OrdenesRepository {
  /** Crea la orden; el servidor la asigna a un repartidor o la deja en cola. */
  crear(nueva: NuevaOrden): Observable<ResultadoEscritura<Orden>>;

  /** Página de órdenes visibles para el usuario, de la más reciente a la más antigua. */
  listar(filtro: FiltroOrdenes): Observable<Pagina<Orden>>;

  /** Mueve la orden a `EN_RUTA` (salida a ruta) o a `ENTREGADA`. */
  cambiarEstado(folio: string, estado: EstadoDestino): Observable<ResultadoEscritura<Orden>>;
}

export const ORDENES_REPOSITORY = new InjectionToken<OrdenesRepository>('OrdenesRepository');
