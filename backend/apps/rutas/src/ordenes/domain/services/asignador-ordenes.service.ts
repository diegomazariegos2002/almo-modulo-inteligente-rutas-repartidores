import type { Repartidor } from '../../../repartidores/domain/entities/repartidor.entity';
import { distanciaHaversineKm, type PuntoGeografico } from '../../../shared/domain/services/distancia-haversine.service';

/** Dos distancias que difieren menos que esto se consideran un empate. */
const EMPATE_KM = 1e-9;

/**
 * Regla de asignación: la orden va al repartidor DISPONIBLE más cercano a su
 * destino (distancia de Haversine desde la posición actual del repartidor).
 *
 * - Solo compiten los repartidores a los que el paquete les cabe.
 * - Empate de distancia: gana quien tiene menos paradas pendientes y, si
 *   persiste, el de menor id. Así el resultado es siempre el mismo.
 * - Si nadie puede recibirla devuelve `null`: la orden se queda en cola.
 */
export function elegirRepartidor(destino: PuntoGeografico, pesoKg: number, candidatos: readonly Repartidor[]): Repartidor | null {
  let elegido: Repartidor | null = null;
  let distanciaElegido = Number.POSITIVE_INFINITY;

  for (const candidato of candidatos) {
    if (!candidato.puedeRecibir(pesoKg)) continue;

    const distancia = distanciaHaversineKm(candidato, destino);
    const empate = Math.abs(distancia - distanciaElegido) <= EMPATE_KM;

    if (elegido === null || (!empate && distancia < distanciaElegido) || (empate && desempata(candidato, elegido))) {
      elegido = candidato;
      distanciaElegido = distancia;
    }
  }

  return elegido;
}

function desempata(candidato: Repartidor, actual: Repartidor): boolean {
  if (candidato.paradasPendientes !== actual.paradasPendientes) {
    return candidato.paradasPendientes < actual.paradasPendientes;
  }
  return candidato.id < actual.id;
}
