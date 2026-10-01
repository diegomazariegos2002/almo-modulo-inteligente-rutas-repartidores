import { distanciaHaversineKm, type PuntoGeografico } from '../../../shared/domain/services/distancia-haversine.service';

/** Lo mínimo que necesita el optimizador de una parada: dónde está y cómo desempatar. */
export interface ParadaOptimizable extends PuntoGeografico {
  readonly folio: string;
}

/** Mejora mínima para aceptar un cambio: evita ciclos por ruido de punto flotante. */
const MEJORA_MINIMA_KM = 1e-9;

/**
 * Ordena las paradas pendientes de un repartidor para acortar el recorrido.
 *
 * 1. Vecino más cercano: desde la posición actual, ir siempre a la parada
 *    pendiente más próxima. Es rápido (O(n²)) y da una ruta razonable.
 * 2. Mejora 2-opt: si invertir un tramo de la ruta la acorta, se invierte, y se
 *    repite hasta que ningún cambio ayude. Elimina los cruces que deja el paso 1.
 *
 * La ruta es abierta: empieza en `origen` y termina en la última parada, sin
 * regreso a una base. El resultado es determinista (los empates se resuelven
 * por folio) y es una buena ruta, no necesariamente la óptima.
 */
export function optimizarRuta<T extends ParadaOptimizable>(origen: PuntoGeografico, paradas: readonly T[]): T[] {
  return mejorar2Opt(origen, vecinoMasCercano(origen, paradas));
}

/** Paso 1 — heurística del vecino más cercano. */
export function vecinoMasCercano<T extends ParadaOptimizable>(origen: PuntoGeografico, paradas: readonly T[]): T[] {
  const pendientes = [...paradas];
  const ruta: T[] = [];
  let actual: PuntoGeografico = origen;

  while (pendientes.length > 0) {
    let indiceMejor = 0;
    let distanciaMejor = Number.POSITIVE_INFINITY;

    pendientes.forEach((candidata, indice) => {
      const distancia = distanciaHaversineKm(actual, candidata);
      const mejor = pendientes[indiceMejor] as T;
      const empate = Math.abs(distancia - distanciaMejor) <= MEJORA_MINIMA_KM;

      if ((!empate && distancia < distanciaMejor) || (empate && candidata.folio < mejor.folio)) {
        indiceMejor = indice;
        distanciaMejor = distancia;
      }
    });

    const [siguiente] = pendientes.splice(indiceMejor, 1) as [T];
    ruta.push(siguiente);
    actual = siguiente;
  }

  return ruta;
}

/** Paso 2 — mejora local 2-opt sobre una ruta abierta con origen fijo. */
export function mejorar2Opt<T extends ParadaOptimizable>(origen: PuntoGeografico, rutaInicial: readonly T[]): T[] {
  const ruta = [...rutaInicial];
  const n = ruta.length;
  let huboMejora = n > 2;

  while (huboMejora) {
    huboMejora = false;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        // Invertir el tramo [i..j] solo cambia las dos aristas de sus extremos.
        const anterior: PuntoGeografico = i === 0 ? origen : (ruta[i - 1] as T);
        const primero = ruta[i] as T;
        const ultimo = ruta[j] as T;
        const posterior = ruta[j + 1];

        const antes = distanciaHaversineKm(anterior, primero) + (posterior ? distanciaHaversineKm(ultimo, posterior) : 0);
        const despues = distanciaHaversineKm(anterior, ultimo) + (posterior ? distanciaHaversineKm(primero, posterior) : 0);

        if (despues < antes - MEJORA_MINIMA_KM) {
          invertirTramo(ruta, i, j);
          huboMejora = true;
        }
      }
    }
  }

  return ruta;
}

/** Longitud total de una ruta abierta que parte de `origen`. */
export function distanciaRutaKm(origen: PuntoGeografico, paradas: readonly PuntoGeografico[]): number {
  let total = 0;
  let actual = origen;

  for (const parada of paradas) {
    total += distanciaHaversineKm(actual, parada);
    actual = parada;
  }

  return total;
}

function invertirTramo<T>(ruta: T[], desde: number, hasta: number): void {
  for (let a = desde, b = hasta; a < b; a++, b--) {
    const temporal = ruta[a] as T;
    ruta[a] = ruta[b] as T;
    ruta[b] = temporal;
  }
}
