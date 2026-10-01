import { distanciaHaversineKm, type PuntoGeografico, redondearKm } from '../../../shared/domain/services/distancia-haversine.service';
import type { Repartidor } from '../entities/repartidor.entity';
import type { ParadaPendiente } from '../value-objects/parada.vo';
import type { ParadaRuta, Ruta } from '../value-objects/ruta.vo';

/**
 * Arma la ruta de un repartidor a partir de sus paradas YA ordenadas: numera
 * las paradas y calcula la distancia de cada tramo y la acumulada.
 *
 * El acumulado se suma sin redondear y se redondea al final, para que el total
 * no arrastre el error de redondeo de cada tramo.
 */
export function calcularRuta(repartidor: Repartidor, paradasEnOrden: readonly ParadaPendiente[], ahora: Date): Ruta {
  let anterior: PuntoGeografico = repartidor;
  let acumulado = 0;

  const paradas: ParadaRuta[] = paradasEnOrden.map((parada, indice) => {
    const tramo = distanciaHaversineKm(anterior, parada);
    acumulado += tramo;
    anterior = parada;

    return {
      secuencia: indice + 1,
      folio: parada.folio,
      lat: parada.lat,
      lng: parada.lng,
      pesoKg: parada.pesoKg,
      direccion: parada.direccion,
      estado: parada.estado,
      distanciaDesdeAnteriorKm: redondearKm(tramo),
      distanciaAcumuladaKm: redondearKm(acumulado),
    };
  });

  return {
    repartidor: {
      id: repartidor.id,
      nombre: repartidor.nombre,
      estado: repartidor.estado,
      lat: repartidor.lat,
      lng: repartidor.lng,
      capacidadKg: repartidor.capacidadKg,
      cargaKg: repartidor.cargaKg,
    },
    paradas,
    totalParadas: paradas.length,
    distanciaTotalKm: redondearKm(acumulado),
    calculadaEn: ahora.toISOString(),
  };
}
