import {
  RUTA_ANA_PLAIN,
  RUTA_CARLA_PLAIN,
  RUTA_LARGA_PLAIN,
  RUTA_VACIA_PLAIN,
} from '../Infrastructure/Angular/_fixtures/repartidores.fixtures';
import { Parada } from './parada.entity';
import { Repartidor } from './repartidor.entity';
import { Ruta } from './ruta.entity';

describe('Ruta', () => {
  it('fromPlain() construye el repartidor y las paradas como entidades', () => {
    const ruta = Ruta.fromPlain(RUTA_ANA_PLAIN);

    expect(ruta.repartidor).toBeInstanceOf(Repartidor);
    expect(ruta.repartidor.nombre).toBe('Ana López');
    expect(ruta.paradas.every((parada) => parada instanceof Parada)).toBeTrue();
    expect(ruta.paradas.map((parada) => parada.folio)).toEqual(['ORD-000003', 'ORD-000004']);
    expect(ruta.totalParadas).toBe(2);
    expect(ruta.distanciaTotalKm).toBe(6.02);
    expect(ruta.calculadaEn).toEqual(new Date('2026-09-30T15:10:01.000Z'));
  });

  it('una ruta sin paradas es válida: está vacía y no tiene primera parada', () => {
    const ruta = Ruta.fromPlain(RUTA_VACIA_PLAIN);

    expect(ruta.vacia).toBeTrue();
    expect(ruta.primeraParada).toBeNull();
    expect(ruta.puedeIniciarse).toBeFalse();
  });

  it('la primera parada es la primera del orden calculado por el servidor', () => {
    expect(Ruta.fromPlain(RUTA_ANA_PLAIN).primeraParada?.folio).toBe('ORD-000003');
  });

  it('puede iniciarse si tiene paradas y el repartidor aún no ha salido', () => {
    expect(Ruta.fromPlain(RUTA_ANA_PLAIN).puedeIniciarse).toBeTrue();
  });

  it('no puede iniciarse si el repartidor ya está en ruta', () => {
    expect(Ruta.fromPlain(RUTA_CARLA_PLAIN).puedeIniciarse).toBeFalse();
  });
});

describe('Repartidor', () => {
  const base = RUTA_ANA_PLAIN.repartidor;

  it('sabe si ya salió a ruta', () => {
    expect(Repartidor.fromPlain(base).enRuta).toBeFalse();
    expect(Repartidor.fromPlain(RUTA_CARLA_PLAIN.repartidor).enRuta).toBeTrue();
  });

  it('calcula el porcentaje de la capacidad que ocupa su carga', () => {
    expect(Repartidor.fromPlain(base).porcentajeCarga).toBe(15); // 7.5 de 50 kg
  });

  it('acota el porcentaje a 100 y evita dividir entre una capacidad de cero', () => {
    expect(Repartidor.fromPlain({ ...base, cargaKg: 80 }).porcentajeCarga).toBe(100);
    expect(Repartidor.fromPlain({ ...base, capacidadKg: 0 }).porcentajeCarga).toBe(0);
  });

  it('solo conoce sus paradas pendientes cuando viene del listado de despacho', () => {
    expect(Repartidor.fromPlain(base).paradasPendientes).toBeNull();
    expect(Repartidor.fromPlain({ ...base, paradasPendientes: 2 }).paradasPendientes).toBe(2);
  });
});

describe('Parada', () => {
  it('es entregable solo cuando su orden ya está en ruta', () => {
    expect(Parada.fromPlain(RUTA_CARLA_PLAIN.paradas[0]).entregable).toBeTrue();
    expect(Parada.fromPlain(RUTA_ANA_PLAIN.paradas[0]).entregable).toBeFalse();
  });

  it('describe el destino con la dirección o, si falta, con las coordenadas', () => {
    expect(Parada.fromPlain(RUTA_ANA_PLAIN.paradas[0]).destino).toBe('Zona 4, Ciudad de Guatemala');
    expect(Parada.fromPlain(RUTA_LARGA_PLAIN.paradas[2]).destino).toBe('14.5870, -90.5460');
  });
});
