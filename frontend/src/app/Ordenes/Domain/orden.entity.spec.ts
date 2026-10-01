import {
  ORDEN_ASIGNADA_PLAIN,
  ORDEN_EN_COLA_PLAIN,
} from '../Infrastructure/Angular/_fixtures/ordenes.fixtures';
import { Orden } from './orden.entity';

describe('Orden', () => {
  it('fromPlain() copia los datos de la API y convierte las fechas a Date', () => {
    const orden = Orden.fromPlain(ORDEN_ASIGNADA_PLAIN);

    expect(orden.folio).toBe('ORD-000003');
    expect(orden.peso).toBe(4.5);
    expect(orden.estado).toBe('ASIGNADA');
    expect(orden.repartidor).toEqual({ id: 1, nombre: 'Ana López' });
    expect(orden.secuenciaRuta).toBe(1);
    expect(orden.creadaEn).toEqual(new Date('2026-09-30T15:00:00.000Z'));
    expect(orden.actualizadaEn).toEqual(new Date('2026-09-30T15:00:01.000Z'));
  });

  it('fromPlain() conserva el historial en orden y con fechas Date', () => {
    const { historial } = Orden.fromPlain(ORDEN_ASIGNADA_PLAIN);

    expect(historial.map((cambio) => cambio.estado)).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA']);
    expect(historial[1].estadoDescripcion).toBe('Asignada');
    expect(historial[1].fecha).toEqual(new Date('2026-09-30T15:00:01.000Z'));
  });

  it('está en cola solo mientras espera a que se le asigne un repartidor', () => {
    expect(Orden.fromPlain(ORDEN_EN_COLA_PLAIN).enCola).toBeTrue();
    expect(Orden.fromPlain(ORDEN_ASIGNADA_PLAIN).enCola).toBeFalse();
  });

  it('describe el destino con la dirección de referencia cuando existe', () => {
    expect(Orden.fromPlain(ORDEN_ASIGNADA_PLAIN).destino).toBe('Zona 4, Ciudad de Guatemala');
  });

  it('describe el destino con las coordenadas cuando no hay dirección', () => {
    expect(Orden.fromPlain(ORDEN_EN_COLA_PLAIN).destino).toBe('14.5930, -90.4890');
  });
});
