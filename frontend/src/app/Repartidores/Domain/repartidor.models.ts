import { EstadoOrden } from '@ordenes/Domain/orden.models';

export type EstadoRepartidor = 'DISPONIBLE' | 'EN_RUTA';

/** Repartidor tal como viaja en la API. `paradasPendientes` solo llega en el listado de despacho. */
export interface RepartidorPlain {
  id: number;
  nombre: string;
  estado: EstadoRepartidor;
  estadoDescripcion: string;
  lat: number;
  lng: number;
  capacidadKg: number;
  cargaKg: number;
  paradasPendientes?: number;
}

/** Parada de una ruta. Su estado es el de la orden que se entrega en ella. */
export interface ParadaPlain {
  secuencia: number;
  folio: string;
  lat: number;
  lng: number;
  peso: number;
  direccion: string | null;
  estado: EstadoOrden;
  estadoDescripcion: string;
  distanciaDesdeAnteriorKm: number;
  distanciaAcumuladaKm: number;
}

export interface RutaPlain {
  repartidor: RepartidorPlain;
  paradas: ParadaPlain[];
  totalParadas: number;
  distanciaTotalKm: number;
  calculadaEn: string;
}
