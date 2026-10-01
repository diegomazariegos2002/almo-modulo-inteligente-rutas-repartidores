import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Pagina, ResultadoEscritura } from '@shared/Domain/api.models';
import { RespuestaEscrituraApi } from '@shared/Infrastructure/Http/respuesta-api.models';
import { map, Observable } from 'rxjs';
import { Orden } from '../Domain/orden.entity';
import { EstadoDestino, FiltroOrdenes, NuevaOrden, OrdenPlain } from '../Domain/orden.models';
import { OrdenesRepository } from '../Domain/ordenes.repository';

/** Del sobre de escritura de la API al resultado que usa la aplicación. */
function aResultado(respuesta: RespuestaEscrituraApi<OrdenPlain>): ResultadoEscritura<Orden> {
  return { mensaje: respuesta.message, data: Orden.fromPlain(respuesta.data) };
}

@Injectable()
export class OrdenesHttpRepository implements OrdenesRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/ordenes`;

  crear(nueva: NuevaOrden): Observable<ResultadoEscritura<Orden>> {
    return this.http.post<RespuestaEscrituraApi<OrdenPlain>>(this.url, nueva).pipe(map(aResultado));
  }

  listar(filtro: FiltroOrdenes): Observable<Pagina<Orden>> {
    let params = new HttpParams().set('page', filtro.page).set('limit', filtro.limit);
    if (filtro.estado) {
      params = params.set('estado', filtro.estado);
    }

    return this.http
      .get<Pagina<OrdenPlain>>(this.url, { params })
      .pipe(map(({ data, meta }) => ({ data: data.map((plain) => Orden.fromPlain(plain)), meta })));
  }

  cambiarEstado(folio: string, estado: EstadoDestino): Observable<ResultadoEscritura<Orden>> {
    return this.http
      .patch<RespuestaEscrituraApi<OrdenPlain>>(`${this.url}/${encodeURIComponent(folio)}/estado`, {
        estado,
      })
      .pipe(map(aResultado));
  }
}
