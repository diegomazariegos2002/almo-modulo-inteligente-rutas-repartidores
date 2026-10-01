import { ESTADO_ORDEN } from '../../shared/domain/value-objects/estado-orden.vo';
import { Repartidor, type RepartidorProps } from './entities/repartidor.entity';
import { calcularRuta } from './services/calculadora-ruta.service';
import { ESTADO_REPARTIDOR } from './value-objects/estado-repartidor.vo';
import type { ParadaPendiente } from './value-objects/parada.vo';

const repartidor = (cambios: Partial<RepartidorProps> = {}): Repartidor =>
  new Repartidor({
    id: 1,
    nombre: 'Ana López',
    lat: 14.6417,
    lng: -90.5133,
    estado: ESTADO_REPARTIDOR.DISPONIBLE,
    capacidadKg: 50,
    cargaKg: 0,
    paradasPendientes: 0,
    ...cambios,
  });

describe('Repartidor', () => {
  describe('puedeRecibir', () => {
    it('acepta una orden si está disponible y el paquete le cabe', () => {
      expect(repartidor({ cargaKg: 40 }).puedeRecibir(10)).toBe(true);
    });

    it('rechaza una orden que excede su capacidad libre', () => {
      expect(repartidor({ cargaKg: 40 }).puedeRecibir(10.01)).toBe(false);
    });

    it('rechaza cualquier orden mientras está en ruta, aunque tenga espacio', () => {
      expect(repartidor({ estado: ESTADO_REPARTIDOR.EN_RUTA, cargaKg: 0 }).puedeRecibir(1)).toBe(false);
    });

    it('no falla por redondeo de punto flotante al llenar exactamente la capacidad', () => {
      // 0.1 + 0.2 = 0.30000000000000004 en punto flotante.
      expect(repartidor({ capacidadKg: 0.3, cargaKg: 0.1 }).puedeRecibir(0.2)).toBe(true);
    });
  });

  it('registrarAsignacion suma el peso y una parada', () => {
    const r = repartidor({ cargaKg: 5, paradasPendientes: 1 });

    r.registrarAsignacion(4.5);

    expect(r.cargaKg).toBe(9.5);
    expect(r.paradasPendientes).toBe(2);
    expect(r.capacidadLibreKg).toBe(40.5);
  });

  it('salirARuta lo deja EN_RUTA y sin poder recibir órdenes', () => {
    const r = repartidor({ cargaKg: 5, paradasPendientes: 1 });

    r.salirARuta();

    expect(r.estado).toBe(ESTADO_REPARTIDOR.EN_RUTA);
    expect(r.disponible).toBe(false);
  });

  describe('registrarEntrega', () => {
    it('lo mueve al destino entregado y descuenta la carga', () => {
      const r = repartidor({ estado: ESTADO_REPARTIDOR.EN_RUTA, cargaKg: 7.5, paradasPendientes: 2 });

      r.registrarEntrega({ lat: 14.6229, lng: -90.5155 }, 4.5);

      expect(r).toMatchObject({ lat: 14.6229, lng: -90.5155, cargaKg: 3, paradasPendientes: 1 });
      expect(r.estado).toBe(ESTADO_REPARTIDOR.EN_RUTA);
    });

    it('al entregar la última parada vuelve a DISPONIBLE y queda sin carga', () => {
      const r = repartidor({ estado: ESTADO_REPARTIDOR.EN_RUTA, cargaKg: 3, paradasPendientes: 1 });

      r.registrarEntrega({ lat: 14.605, lng: -90.522 }, 3);

      expect(r.estado).toBe(ESTADO_REPARTIDOR.DISPONIBLE);
      expect(r.cargaKg).toBe(0);
      expect(r.paradasPendientes).toBe(0);
      expect(r.puedeRecibir(50)).toBe(true);
    });
  });
});

describe('calcularRuta', () => {
  const ahora = new Date('2026-09-30T15:00:00.000Z');
  const parada = (folio: string, lat: number, lng: number, pesoKg = 1): ParadaPendiente => ({
    folio,
    lat,
    lng,
    pesoKg,
    direccion: null,
    estado: ESTADO_ORDEN.ASIGNADA,
  });

  it('una ruta sin paradas es válida y mide 0 km', () => {
    const ruta = calcularRuta(repartidor(), [], ahora);

    expect(ruta).toMatchObject({ paradas: [], totalParadas: 0, distanciaTotalKm: 0, calculadaEn: '2026-09-30T15:00:00.000Z' });
    expect(ruta.repartidor).toMatchObject({ id: 1, nombre: 'Ana López', estado: 'DISPONIBLE', capacidadKg: 50, cargaKg: 0 });
  });

  it('numera las paradas en el orden recibido y mide cada tramo', () => {
    // Zona 1 → Zona 4 (≈2.10 km) → Zona 9 (≈2.11 km).
    const ruta = calcularRuta(repartidor(), [parada('ORD-000003', 14.6229, -90.5155), parada('ORD-000004', 14.605, -90.522)], ahora);

    expect(ruta.paradas.map((p) => [p.secuencia, p.folio])).toEqual([
      [1, 'ORD-000003'],
      [2, 'ORD-000004'],
    ]);
    expect(ruta.paradas[0]?.distanciaDesdeAnteriorKm).toBe(2.1);
    expect(ruta.paradas[1]?.distanciaDesdeAnteriorKm).toBe(2.11);
    expect(ruta.totalParadas).toBe(2);
  });

  it('el primer tramo sale de la posición actual del repartidor', () => {
    const enLaParada = repartidor({ lat: 14.6229, lng: -90.5155 });

    const ruta = calcularRuta(enLaParada, [parada('ORD-000003', 14.6229, -90.5155)], ahora);

    expect(ruta.paradas[0]?.distanciaDesdeAnteriorKm).toBe(0);
  });

  it('el acumulado de la última parada es la distancia total', () => {
    const ruta = calcularRuta(repartidor({ lat: 0, lng: 0 }), [parada('A', 0, 1), parada('B', 0, 2), parada('C', 0, 3)], ahora);

    expect(ruta.paradas[2]?.distanciaAcumuladaKm).toBe(ruta.distanciaTotalKm);
    expect(ruta.distanciaTotalKm).toBeCloseTo(333.58, 1);
  });

  it('no arrastra el error de redondeo de cada tramo al total', () => {
    // Tres tramos de 0.004 km: redondeados suman 0, pero el total real es 0.012 → 0.01.
    const paso = 0.004 / 111.195;
    const ruta = calcularRuta(
      repartidor({ lat: 0, lng: 0 }),
      [parada('A', 0, paso), parada('B', 0, paso * 2), parada('C', 0, paso * 3)],
      ahora,
    );

    expect(ruta.paradas.map((p) => p.distanciaDesdeAnteriorKm)).toEqual([0, 0, 0]);
    expect(ruta.distanciaTotalKm).toBe(0.01);
  });
});
