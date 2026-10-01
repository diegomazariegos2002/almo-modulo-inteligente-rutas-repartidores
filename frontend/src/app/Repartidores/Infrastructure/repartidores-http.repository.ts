import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';
import { Repartidor } from '../Domain/repartidor.entity';
import { RepartidorPlain, RutaPlain } from '../Domain/repartidor.models';
import { RepartidoresRepository } from '../Domain/repartidores.repository';
import { Ruta } from '../Domain/ruta.entity';

@Injectable()
export class RepartidoresHttpRepository implements RepartidoresRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/repartidores`;

  listar(): Observable<Repartidor[]> {
    return this.http
      .get<RepartidorPlain[]>(this.url)
      .pipe(map((repartidores) => repartidores.map((plain) => Repartidor.fromPlain(plain))));
  }

  obtenerRuta(repartidorId: number): Observable<Ruta> {
    return this.http
      .get<RutaPlain>(`${this.url}/${repartidorId}/ruta`)
      .pipe(map((plain) => Ruta.fromPlain(plain)));
  }
}
