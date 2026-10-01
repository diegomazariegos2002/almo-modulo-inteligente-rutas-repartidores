import { distanciaRutaKm, mejorar2Opt, optimizarRuta, type ParadaOptimizable, vecinoMasCercano } from './optimizador-ruta.service';

/*
 * Las pruebas usan una rejilla de grados enteros cerca del ecuador, donde 1° de
 * latitud y 1° de longitud miden casi lo mismo (~111 km): se razona como en un plano.
 */
const origen = { lat: 0, lng: 0 };
const parada = (folio: string, lat: number, lng: number): ParadaOptimizable => ({ folio, lat, lng });
const folios = (ruta: readonly ParadaOptimizable[]): string => ruta.map((p) => p.folio).join(' → ');

/** Todas las permutaciones: fuerza bruta para conocer la ruta óptima en casos pequeños. */
function permutaciones<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) => permutaciones([...items.slice(0, i), ...items.slice(i + 1)]).map((resto) => [item, ...resto]));
}

function distanciaOptima(paradas: readonly ParadaOptimizable[]): number {
  return Math.min(...permutaciones(paradas).map((ruta) => distanciaRutaKm(origen, ruta)));
}

describe('vecinoMasCercano', () => {
  it('sin paradas devuelve una ruta vacía', () => {
    expect(vecinoMasCercano(origen, [])).toEqual([]);
  });

  it('con una parada la devuelve tal cual', () => {
    const unica = parada('A', 1, 1);

    expect(vecinoMasCercano(origen, [unica])).toEqual([unica]);
  });

  it('visita siempre la parada pendiente más cercana a la posición actual', () => {
    // Sobre una línea: desde 0 la más cercana es A(1); desde A, B(2); desde B, C(5).
    const paradas = [parada('C', 0, 5), parada('A', 0, 1), parada('B', 0, 2)];

    expect(folios(vecinoMasCercano(origen, paradas))).toBe('A → B → C');
  });

  it('el orden de entrada no cambia el resultado', () => {
    const paradas = [parada('A', 0, 1), parada('B', 2, 2), parada('C', -1, 3), parada('D', 3, -2)];
    const referencia = folios(vecinoMasCercano(origen, paradas));

    for (const mezcla of permutaciones(paradas)) {
      expect(folios(vecinoMasCercano(origen, mezcla))).toBe(referencia);
    }
  });

  it('resuelve los empates de distancia por folio', () => {
    // A y B están exactamente a la misma distancia del origen.
    const paradas = [parada('B', 0, -1), parada('A', 0, 1)];

    expect(folios(vecinoMasCercano(origen, paradas))).toBe('A → B');
  });

  it('admite dos paradas en la misma coordenada', () => {
    const paradas = [parada('B', 0, 1), parada('A', 0, 1), parada('C', 0, 2)];

    expect(folios(vecinoMasCercano(origen, paradas))).toBe('A → B → C');
  });

  it('no modifica el arreglo recibido', () => {
    const paradas = [parada('C', 0, 5), parada('A', 0, 1)];

    vecinoMasCercano(origen, paradas);

    expect(folios(paradas)).toBe('C → A');
  });
});

describe('mejorar2Opt', () => {
  it('con menos de tres paradas no hay nada que invertir', () => {
    const ruta = [parada('A', 0, 2), parada('B', 0, 1)];

    expect(folios(mejorar2Opt(origen, ruta))).toBe('A → B');
  });

  it('invierte un tramo cuando eso acorta la ruta', () => {
    // Visitar C antes que B obliga a volver sobre los propios pasos.
    const ruta = [parada('A', 0, 1), parada('C', 0, 3), parada('B', 0, 2)];

    expect(folios(mejorar2Opt(origen, ruta))).toBe('A → B → C');
  });

  it('nunca alarga la ruta que recibe', () => {
    const paradas = [parada('A', 2, -1), parada('B', -3, 2), parada('C', 1, 3), parada('D', -2, -2), parada('E', 3, 1)];

    for (const ruta of permutaciones(paradas)) {
      expect(distanciaRutaKm(origen, mejorar2Opt(origen, ruta))).toBeLessThanOrEqual(distanciaRutaKm(origen, ruta) + 1e-6);
    }
  });
});

describe('optimizarRuta (vecino más cercano + 2-opt)', () => {
  it('devuelve una permutación de las paradas recibidas', () => {
    const paradas = [parada('A', 2, -1), parada('B', -3, 2), parada('C', 1, 3), parada('D', -2, -2)];

    const ruta = optimizarRuta(origen, paradas);

    expect(ruta).toHaveLength(paradas.length);
    expect([...ruta].sort((a, b) => a.folio.localeCompare(b.folio))).toEqual(paradas);
  });

  it('corrige con 2-opt el cruce que deja el vecino más cercano y alcanza el óptimo', () => {
    const paradas = [parada('A', -1, 3), parada('B', 0, -3), parada('C', -2, -3), parada('D', 1, -3)];

    const soloVecino = vecinoMasCercano(origen, paradas);
    const optimizada = optimizarRuta(origen, paradas);

    expect(folios(soloVecino)).toBe('B → D → C → A');
    expect(folios(optimizada)).toBe('D → B → C → A');
    expect(distanciaRutaKm(origen, optimizada)).toBeLessThan(distanciaRutaKm(origen, soloVecino));
    expect(distanciaRutaKm(origen, optimizada)).toBeCloseTo(distanciaOptima(paradas), 6);
  });

  it('LIMITACIÓN: es una heurística, no garantiza la ruta óptima', () => {
    const paradas = [parada('A', -2, 1), parada('B', 3, -1), parada('C', 0, 3), parada('D', 1, 0)];

    const optimizada = optimizarRuta(origen, paradas);
    const heuristica = distanciaRutaKm(origen, optimizada);
    const optima = distanciaOptima(paradas);

    // Empezar por la parada más cercana (D) es justo lo que impide la mejor ruta (A → C → D → B).
    expect(folios(optimizada)).toBe('D → B → C → A');
    expect(heuristica).toBeGreaterThan(optima);
    expect(heuristica / optima).toBeLessThan(1.1);
  });

  it('en casos pequeños se mantiene cerca del óptimo', () => {
    const conjuntos = [
      [parada('A', 1, 1), parada('B', -1, 2), parada('C', 2, -2), parada('D', -2, -1), parada('E', 0, 3)],
      [parada('A', 3, 0), parada('B', 0, 3), parada('C', -3, 0), parada('D', 0, -3), parada('E', 2, 2), parada('F', -2, -2)],
      [parada('A', 1, 0), parada('B', 2, 0), parada('C', 3, 0), parada('D', -1, 0), parada('E', -2, 0)],
    ];

    for (const paradas of conjuntos) {
      const heuristica = distanciaRutaKm(origen, optimizarRuta(origen, paradas));

      expect(heuristica / distanciaOptima(paradas)).toBeLessThan(1.25);
    }
  });

  it('es determinista: misma entrada, misma ruta', () => {
    const paradas = [parada('A', 2, -1), parada('B', -3, 2), parada('C', 1, 3), parada('D', -2, -2), parada('E', 3, 1)];

    expect(folios(optimizarRuta(origen, paradas))).toBe(folios(optimizarRuta(origen, [...paradas].reverse())));
  });

  it('parte de la posición actual del repartidor, no de un punto fijo', () => {
    const paradas = [parada('A', 0, 1), parada('B', 0, 10)];

    expect(folios(optimizarRuta({ lat: 0, lng: 0 }, paradas))).toBe('A → B');
    expect(folios(optimizarRuta({ lat: 0, lng: 11 }, paradas))).toBe('B → A');
  });
});

describe('distanciaRutaKm', () => {
  it('suma los tramos desde el origen', () => {
    const unGrado = distanciaRutaKm(origen, [parada('A', 0, 1)]);

    expect(distanciaRutaKm(origen, [])).toBe(0);
    expect(distanciaRutaKm(origen, [parada('A', 0, 1), parada('B', 0, 2), parada('C', 0, 3)])).toBeCloseTo(unGrado * 3, 6);
  });
});
