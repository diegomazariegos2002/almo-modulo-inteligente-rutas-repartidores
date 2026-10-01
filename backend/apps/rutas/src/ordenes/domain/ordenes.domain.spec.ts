import { isErr, isOk } from '@almo/result';
import { Repartidor, type RepartidorProps } from '../../repartidores/domain/entities/repartidor.entity';
import { ESTADO_REPARTIDOR } from '../../repartidores/domain/value-objects/estado-repartidor.vo';
import { ESTADO_ORDEN } from '../../shared/domain/value-objects/estado-orden.vo';
import { Orden, type OrdenProps } from './entities/orden.entity';
import { TransicionEstadoInvalida } from './exceptions';
import { elegirRepartidor } from './services/asignador-ordenes.service';

const creada = new Date('2026-09-30T15:00:00.000Z');
const despues = new Date('2026-09-30T15:05:00.000Z');
const ana = { id: 1, nombre: 'Ana López' };

const orden = (cambios: Partial<OrdenProps> = {}): Orden =>
  new Orden({
    id: 'ord-1',
    folio: 'ORD-000001',
    lat: 14.6229,
    lng: -90.5155,
    pesoKg: 4.5,
    direccion: null,
    estado: ESTADO_ORDEN.PENDIENTE_ASIGNACION,
    clienteId: 'cli-1',
    repartidor: null,
    secuenciaRuta: null,
    creadaEn: creada,
    actualizadaEn: creada,
    historial: [{ estado: ESTADO_ORDEN.PENDIENTE_ASIGNACION, fecha: creada, repartidorId: null }],
    ...cambios,
  });

describe('Orden', () => {
  it('recorre el ciclo completo y anota cada cambio con su fecha', () => {
    const o = orden();
    const t1 = new Date('2026-09-30T15:00:01.000Z');
    const t2 = new Date('2026-09-30T16:00:00.000Z');
    const t3 = new Date('2026-09-30T16:30:00.000Z');

    expect(isOk(o.asignarA(ana, t1))).toBe(true);
    expect(isOk(o.iniciarRuta(t2))).toBe(true);
    expect(isOk(o.entregar(t3))).toBe(true);

    expect(o.estado).toBe(ESTADO_ORDEN.ENTREGADA);
    expect(o.actualizadaEn).toBe(t3);
    expect(o.historial).toEqual([
      { estado: 'PENDIENTE_ASIGNACION', fecha: creada, repartidorId: null },
      { estado: 'ASIGNADA', fecha: t1, repartidorId: 1 },
      { estado: 'EN_RUTA', fecha: t2, repartidorId: 1 },
      { estado: 'ENTREGADA', fecha: t3, repartidorId: 1 },
    ]);
  });

  it('al asignarse guarda quién es su repartidor', () => {
    const o = orden();

    o.asignarA(ana, despues);

    expect(o.estado).toBe(ESTADO_ORDEN.ASIGNADA);
    expect(o.repartidor).toEqual(ana);
  });

  it('al entregarse deja de tener posición en la ruta', () => {
    const o = orden({ estado: ESTADO_ORDEN.EN_RUTA, repartidor: ana, secuenciaRuta: 2 });

    o.entregar(despues);

    expect(o.secuenciaRuta).toBeNull();
    expect(o.repartidor).toEqual(ana);
  });

  it.each([
    ['entregar una orden en cola', orden(), (o: Orden) => o.entregar(despues)],
    ['poner en ruta una orden en cola', orden(), (o: Orden) => o.iniciarRuta(despues)],
    [
      'entregar una orden que no ha salido a ruta',
      orden({ estado: ESTADO_ORDEN.ASIGNADA, repartidor: ana }),
      (o: Orden) => o.entregar(despues),
    ],
    [
      'reasignar una orden ya asignada',
      orden({ estado: ESTADO_ORDEN.ASIGNADA, repartidor: ana }),
      (o: Orden) => o.asignarA({ id: 2, nombre: 'Bruno' }, despues),
    ],
    [
      'poner en ruta una orden que ya está en ruta',
      orden({ estado: ESTADO_ORDEN.EN_RUTA, repartidor: ana }),
      (o: Orden) => o.iniciarRuta(despues),
    ],
    ['entregar dos veces', orden({ estado: ESTADO_ORDEN.ENTREGADA, repartidor: ana }), (o: Orden) => o.entregar(despues)],
  ])('rechaza %s y no cambia nada', (_caso, o, accion) => {
    const estadoAntes = o.estado;
    const repartidorAntes = o.repartidor;

    const resultado = accion(o);

    expect(isErr(resultado)).toBe(true);
    if (isErr(resultado)) {
      expect(resultado.error).toBeInstanceOf(TransicionEstadoInvalida);
      expect(resultado.error.httpStatus).toBe(409);
      expect(resultado.error.code).toBe('RUTAS.TRANSICION_ESTADO_INVALIDA');
    }
    expect(o.estado).toBe(estadoAntes);
    expect(o.repartidor).toBe(repartidorAntes);
    expect(o.historial).toHaveLength(1);
    expect(o.cambiosSinPersistir).toHaveLength(0);
  });

  it('el error de transición explica el estado actual y el solicitado', () => {
    const resultado = orden({ estado: ESTADO_ORDEN.ENTREGADA, repartidor: ana }).entregar(despues);

    expect(isErr(resultado) && resultado.error.messageParams).toEqual({
      folio: 'ORD-000001',
      actual: 'Entregada',
      solicitado: 'Entregada',
    });
  });

  it('expone solo los cambios nuevos hasta que se marcan como persistidos', () => {
    const o = orden();

    o.asignarA(ana, despues);
    expect(o.cambiosSinPersistir).toEqual([{ estado: 'ASIGNADA', fecha: despues, repartidorId: 1 }]);

    o.marcarPersistida();
    expect(o.cambiosSinPersistir).toHaveLength(0);
    expect(o.historial).toHaveLength(2);
  });
});

describe('elegirRepartidor', () => {
  const destino = { lat: 0, lng: 0 };
  const repartidor = (id: number, lng: number, cambios: Partial<RepartidorProps> = {}): Repartidor =>
    new Repartidor({
      id,
      nombre: `Repartidor ${id}`,
      lat: 0,
      lng,
      estado: ESTADO_REPARTIDOR.DISPONIBLE,
      capacidadKg: 50,
      cargaKg: 0,
      paradasPendientes: 0,
      ...cambios,
    });

  it('elige al repartidor disponible más cercano al destino', () => {
    const elegido = elegirRepartidor(destino, 5, [repartidor(1, 3), repartidor(2, 1), repartidor(3, 2)]);

    expect(elegido?.id).toBe(2);
  });

  it('ignora al más cercano si está en ruta', () => {
    const elegido = elegirRepartidor(destino, 5, [repartidor(1, 0.1, { estado: ESTADO_REPARTIDOR.EN_RUTA }), repartidor(2, 3)]);

    expect(elegido?.id).toBe(2);
  });

  it('ignora al más cercano si el paquete no le cabe', () => {
    const elegido = elegirRepartidor(destino, 10, [repartidor(1, 0.1, { cargaKg: 45 }), repartidor(2, 3)]);

    expect(elegido?.id).toBe(2);
  });

  it('devuelve null si no hay candidatos', () => {
    expect(elegirRepartidor(destino, 5, [])).toBeNull();
  });

  it('devuelve null si nadie está disponible o a nadie le cabe: la orden se queda en cola', () => {
    const candidatos = [repartidor(1, 1, { estado: ESTADO_REPARTIDOR.EN_RUTA }), repartidor(2, 2, { cargaKg: 48 })];

    expect(elegirRepartidor(destino, 5, candidatos)).toBeNull();
  });

  it('en un empate de distancia prefiere a quien tiene menos paradas pendientes', () => {
    const elegido = elegirRepartidor(destino, 5, [repartidor(1, 1, { paradasPendientes: 3 }), repartidor(2, -1, { paradasPendientes: 1 })]);

    expect(elegido?.id).toBe(2);
  });

  it('si el empate persiste gana el de menor id, sin importar el orden de entrada', () => {
    const candidatos = [repartidor(3, 1), repartidor(1, -1), repartidor(2, 1)];

    expect(elegirRepartidor(destino, 5, candidatos)?.id).toBe(1);
    expect(elegirRepartidor(destino, 5, [...candidatos].reverse())?.id).toBe(1);
  });

  it('mide desde la posición actual del repartidor', () => {
    const lejos = repartidor(1, 5);
    const cerca = repartidor(2, 6);
    cerca.registrarAsignacion(1);
    cerca.salirARuta();
    cerca.registrarEntrega({ lat: 0, lng: 0.5 }, 1); // ahora está a medio grado del destino y disponible

    expect(elegirRepartidor(destino, 5, [lejos, cerca])?.id).toBe(2);
  });
});
