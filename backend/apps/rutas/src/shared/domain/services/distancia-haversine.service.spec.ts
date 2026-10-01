import { distanciaHaversineKm, RADIO_TIERRA_KM, redondearKm, type PuntoGeografico } from './distancia-haversine.service';

describe('distanciaHaversineKm', () => {
  const paris: PuntoGeografico = { lat: 48.8566, lng: 2.3522 };
  const londres: PuntoGeografico = { lat: 51.5074, lng: -0.1278 };
  const nuevaYork: PuntoGeografico = { lat: 40.7128, lng: -74.006 };
  const losAngeles: PuntoGeografico = { lat: 34.0522, lng: -118.2437 };

  it('es 0 entre un punto y sí mismo', () => {
    expect(distanciaHaversineKm(paris, paris)).toBe(0);
  });

  // Distancias de círculo máximo publicadas; se tolera ±1 km por el radio usado.
  it('París – Londres ≈ 344 km', () => {
    expect(Math.abs(distanciaHaversineKm(paris, londres) - 343.6)).toBeLessThan(1);
  });

  it('Nueva York – Los Ángeles ≈ 3 936 km', () => {
    expect(Math.abs(distanciaHaversineKm(nuevaYork, losAngeles) - 3935.8)).toBeLessThan(1);
  });

  it('un grado de latitud mide ≈ 111.2 km en cualquier longitud', () => {
    const esperado = (Math.PI * RADIO_TIERRA_KM) / 180;

    expect(distanciaHaversineKm({ lat: 14, lng: -90.5 }, { lat: 15, lng: -90.5 })).toBeCloseTo(esperado, 6);
    expect(distanciaHaversineKm({ lat: 14, lng: 120 }, { lat: 15, lng: 120 })).toBeCloseTo(esperado, 6);
    expect(esperado).toBeCloseTo(111.195, 2);
  });

  it('un grado de longitud se acorta con el coseno de la latitud', () => {
    const enEcuador = distanciaHaversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    const a60Grados = distanciaHaversineKm({ lat: 60, lng: 0 }, { lat: 60, lng: 1 });

    expect(a60Grados / enEcuador).toBeCloseTo(0.5, 3);
  });

  it('entre puntos antipodales mide media circunferencia', () => {
    expect(distanciaHaversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })).toBeCloseTo(Math.PI * RADIO_TIERRA_KM, 6);
    expect(distanciaHaversineKm({ lat: 90, lng: 0 }, { lat: -90, lng: 0 })).toBeCloseTo(Math.PI * RADIO_TIERRA_KM, 6);
  });

  it('es simétrica', () => {
    expect(distanciaHaversineKm(paris, londres)).toBeCloseTo(distanciaHaversineKm(londres, paris), 9);
  });

  it('cruza el antimeridiano por el camino corto', () => {
    const distancia = distanciaHaversineKm({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 });

    expect(distancia).toBeCloseTo((Math.PI * RADIO_TIERRA_KM) / 180, 6);
  });

  it('cumple la desigualdad triangular', () => {
    const directo = distanciaHaversineKm(nuevaYork, londres);
    const conEscala = distanciaHaversineKm(nuevaYork, paris) + distanciaHaversineKm(paris, londres);

    expect(directo).toBeLessThanOrEqual(conEscala);
  });

  it('a escala de ciudad da distancias coherentes (Zona 1 – Zona 4 ≈ 2.1 km)', () => {
    const zona1 = { lat: 14.6417, lng: -90.5133 };
    const zona4 = { lat: 14.6229, lng: -90.5155 };

    expect(redondearKm(distanciaHaversineKm(zona1, zona4))).toBe(2.1);
  });
});

describe('redondearKm', () => {
  it('redondea a 2 decimales', () => {
    expect(redondearKm(2.104)).toBe(2.1);
    expect(redondearKm(2.105)).toBe(2.11);
    expect(redondearKm(0)).toBe(0);
  });
});
