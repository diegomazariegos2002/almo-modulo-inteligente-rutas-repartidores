import { ESTADO_REPARTIDOR } from '../../../repartidores/domain/value-objects/estado-repartidor.vo';
import { crearEscenario, errorDe, type Escenario, valorDe } from '../../../testing/escenario.fakes';
import { OrdenNoEncontrada, TransicionEstadoInvalida } from '../../domain/exceptions';

const orden = (lng: number, peso = 5) => ({ clienteId: 'cli-1', lat: 0, lng, peso });
const estados = (e: Escenario, folio: string): string[] => e.base.orden(folio).historial.map((h) => h.estado);

/** Un repartidor en el origen con tres órdenes asignadas (a 1°, 2° y 3° de longitud). */
async function conTresParadas(): Promise<Escenario> {
  const e = crearEscenario();
  e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });
  valorDe(await e.crearOrden.execute(orden(1)));
  valorDe(await e.crearOrden.execute(orden(2)));
  valorDe(await e.crearOrden.execute(orden(3)));
  e.cache.invalidaciones.length = 0;
  return e;
}

describe('IniciarRutaUseCase', () => {
  it('pone En Ruta todas las órdenes asignadas del repartidor, no solo la indicada', async () => {
    const e = await conTresParadas();

    const iniciada = valorDe(await e.iniciarRuta.execute('ORD-000002'));

    expect(iniciada.paradas).toBe(3);
    expect(iniciada.orden).toMatchObject({ folio: 'ORD-000002', estado: 'EN_RUTA' });
    expect(e.base.ordenes.map((o) => o.estado)).toEqual(['EN_RUTA', 'EN_RUTA', 'EN_RUTA']);
  });

  it('deja al repartidor En Ruta: ya no recibe órdenes nuevas', async () => {
    const e = await conTresParadas();
    valorDe(await e.iniciarRuta.execute('ORD-000001'));

    const nueva = valorDe(await e.crearOrden.execute(orden(1)));

    expect(e.base.repartidor(1).estado).toBe(ESTADO_REPARTIDOR.EN_RUTA);
    expect(nueva.estado).toBe('PENDIENTE_ASIGNACION');
  });

  it('anota el cambio en el historial de cada orden y conserva el orden de la ruta', async () => {
    const e = await conTresParadas();

    valorDe(await e.iniciarRuta.execute('ORD-000001'));

    expect(estados(e, 'ORD-000003')).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA', 'EN_RUTA']);
    expect(e.base.rutaDe(1)).toEqual(['ORD-000001', 'ORD-000002', 'ORD-000003']);
  });

  it('invalida el caché de la ruta del repartidor', async () => {
    const e = await conTresParadas();

    await e.iniciarRuta.execute('ORD-000001');

    expect(e.cache.invalidaciones).toEqual([[1]]);
  });

  it('responde 404 si el folio no existe', async () => {
    const e = await conTresParadas();

    const error = errorDe(await e.iniciarRuta.execute('ORD-999999'));

    expect(error).toBeInstanceOf(OrdenNoEncontrada);
    expect(error.httpStatus).toBe(404);
  });

  it('responde 409 si la orden ya salió a ruta', async () => {
    const e = await conTresParadas();
    valorDe(await e.iniciarRuta.execute('ORD-000001'));

    const error = errorDe(await e.iniciarRuta.execute('ORD-000001'));

    expect(error).toBeInstanceOf(TransicionEstadoInvalida);
    expect(error.httpStatus).toBe(409);
  });

  it('responde 409 si la orden sigue en cola (no tiene repartidor)', async () => {
    const e = crearEscenario();
    valorDe(await e.crearOrden.execute(orden(1)));

    expect(errorDe(await e.iniciarRuta.execute('ORD-000001'))).toBeInstanceOf(TransicionEstadoInvalida);
  });
});

describe('EntregarOrdenUseCase', () => {
  it('marca la parada como entregada y la saca de la ruta', async () => {
    const e = await conTresParadas();
    valorDe(await e.iniciarRuta.execute('ORD-000001'));

    const entregada = valorDe(await e.entregarOrden.execute('ORD-000001'));

    expect(entregada.orden).toMatchObject({ folio: 'ORD-000001', estado: 'ENTREGADA', secuenciaRuta: null });
    expect(entregada.rutaCompletada).toBe(false);
    expect(estados(e, 'ORD-000001')).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA', 'EN_RUTA', 'ENTREGADA']);
    expect(e.base.rutaDe(1)).toEqual(['ORD-000002', 'ORD-000003']);
  });

  it('mueve al repartidor al destino entregado y renumera las paradas restantes desde 1', async () => {
    const e = await conTresParadas();
    valorDe(await e.iniciarRuta.execute('ORD-000001'));

    valorDe(await e.entregarOrden.execute('ORD-000001'));

    expect(e.base.repartidor(1)).toMatchObject({ lat: 0, lng: 1, estado: 'EN_RUTA' });
    expect(e.base.paradasDe(1).map((o) => [o.folio, o.secuenciaRuta])).toEqual([
      ['ORD-000002', 1],
      ['ORD-000003', 2],
    ]);
  });

  it('si entrega fuera de orden, la ruta restante se reordena desde su nueva posición', async () => {
    const e = await conTresParadas();
    valorDe(await e.iniciarRuta.execute('ORD-000001'));

    // Entrega primero la más lejana (3°): ahora la más cercana es la de 2°.
    valorDe(await e.entregarOrden.execute('ORD-000003'));

    expect(e.base.rutaDe(1)).toEqual(['ORD-000002', 'ORD-000001']);
  });

  it('salida implícita: entregar sin haber salido registra En Ruta y Entregada, y saca a ruta el resto', async () => {
    const e = await conTresParadas();

    const entregada = valorDe(await e.entregarOrden.execute('ORD-000001'));

    expect(entregada.orden.estado).toBe('ENTREGADA');
    expect(estados(e, 'ORD-000001')).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA', 'EN_RUTA', 'ENTREGADA']);
    expect(e.base.orden('ORD-000002').estado).toBe('EN_RUTA');
    expect(e.base.orden('ORD-000003').estado).toBe('EN_RUTA');
    expect(e.base.repartidor(1).estado).toBe(ESTADO_REPARTIDOR.EN_RUTA);
  });

  it('al entregar la última parada el repartidor vuelve a Disponible en ese punto', async () => {
    const e = crearEscenario();
    e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });
    valorDe(await e.crearOrden.execute(orden(4)));

    const entregada = valorDe(await e.entregarOrden.execute('ORD-000001'));

    expect(entregada.rutaCompletada).toBe(true);
    expect(e.base.repartidor(1)).toMatchObject({ estado: 'DISPONIBLE', lat: 0, lng: 4 });
    expect(e.base.rutaDe(1)).toEqual([]);
  });

  describe('cola de órdenes pendientes', () => {
    /** Repartidor 1 en ruta con una parada; dos órdenes esperando en cola. */
    async function conCola(): Promise<Escenario> {
      const e = crearEscenario();
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });
      valorDe(await e.crearOrden.execute(orden(1)));
      valorDe(await e.iniciarRuta.execute('ORD-000001'));
      valorDe(await e.crearOrden.execute(orden(6)));
      valorDe(await e.crearOrden.execute(orden(3)));
      e.cache.invalidaciones.length = 0;
      return e;
    }

    it('al liberarse un repartidor se le asignan las órdenes en cola', async () => {
      const e = await conCola();
      expect(e.base.ordenes.filter((o) => o.estado === 'PENDIENTE_ASIGNACION')).toHaveLength(2);

      valorDe(await e.entregarOrden.execute('ORD-000001'));

      expect(e.base.orden('ORD-000002')).toMatchObject({ estado: 'ASIGNADA', repartidorId: 1 });
      expect(e.base.orden('ORD-000003')).toMatchObject({ estado: 'ASIGNADA', repartidorId: 1 });
      expect(estados(e, 'ORD-000002')).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA']);
    });

    it('la ruta nueva queda optimizada desde donde terminó el repartidor', async () => {
      const e = await conCola();

      valorDe(await e.entregarOrden.execute('ORD-000001'));

      // Terminó en lng 1: primero la de lng 3 (ORD-000003) y luego la de lng 6.
      expect(e.base.rutaDe(1)).toEqual(['ORD-000003', 'ORD-000002']);
      expect(e.base.repartidor(1).estado).toBe(ESTADO_REPARTIDOR.DISPONIBLE);
    });

    it('atiende la cola en orden de llegada cuando no cabe todo', async () => {
      const e = crearEscenario();
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, capacidadKg: 10 });
      valorDe(await e.crearOrden.execute(orden(1, 10)));
      valorDe(await e.crearOrden.execute(orden(2, 8))); // en cola, llegó primero
      valorDe(await e.crearOrden.execute(orden(3, 8))); // en cola, llegó después

      valorDe(await e.entregarOrden.execute('ORD-000001'));

      expect(e.base.orden('ORD-000002').estado).toBe('ASIGNADA');
      expect(e.base.orden('ORD-000003').estado).toBe('PENDIENTE_ASIGNACION');
    });

    it('una orden en cola que no cabe no frena a las que vienen detrás', async () => {
      const e = crearEscenario();
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, capacidadKg: 10 });
      valorDe(await e.crearOrden.execute(orden(1, 10)));
      e.base.repartidor(1).capacidadKg = 5; // ahora solo le caben 5 kg
      valorDe(await e.crearOrden.execute(orden(2, 8))); // no le cabrá
      valorDe(await e.crearOrden.execute(orden(3, 4))); // sí le cabe

      valorDe(await e.entregarOrden.execute('ORD-000001'));

      expect(e.base.orden('ORD-000002').estado).toBe('PENDIENTE_ASIGNACION');
      expect(e.base.orden('ORD-000003').estado).toBe('ASIGNADA');
    });

    it('reparte la cola entre todos los repartidores disponibles, cada orden al más cercano', async () => {
      const e = crearEscenario();
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 }).agregarRepartidor({ id: 2, lat: 0, lng: 20, estado: ESTADO_REPARTIDOR.EN_RUTA });
      valorDe(await e.crearOrden.execute(orden(1)));
      valorDe(await e.iniciarRuta.execute('ORD-000001'));
      valorDe(await e.crearOrden.execute(orden(19))); // en cola: su destino está junto al repartidor 2
      e.base.repartidor(2).estado = ESTADO_REPARTIDOR.DISPONIBLE; // el 2 quedó libre sin vaciar la cola

      valorDe(await e.entregarOrden.execute('ORD-000001'));

      expect(e.base.orden('ORD-000002')).toMatchObject({ estado: 'ASIGNADA', repartidorId: 2 });
    });

    it('invalida el caché de todos los repartidores cuya ruta cambió', async () => {
      const e = crearEscenario();
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 }).agregarRepartidor({ id: 2, lat: 0, lng: 20, estado: ESTADO_REPARTIDOR.EN_RUTA });
      valorDe(await e.crearOrden.execute(orden(1)));
      valorDe(await e.iniciarRuta.execute('ORD-000001'));
      valorDe(await e.crearOrden.execute(orden(19)));
      e.base.repartidor(2).estado = ESTADO_REPARTIDOR.DISPONIBLE;
      e.cache.invalidaciones.length = 0;

      valorDe(await e.entregarOrden.execute('ORD-000001'));

      expect(e.cache.invalidaciones).toEqual([[1, 2]]);
    });
  });

  it('invalida el caché de la ruta del repartidor', async () => {
    const e = await conTresParadas();

    await e.entregarOrden.execute('ORD-000001');

    expect(e.cache.invalidaciones).toEqual([[1]]);
  });

  it('responde 404 si el folio no existe', async () => {
    const e = await conTresParadas();

    expect(errorDe(await e.entregarOrden.execute('ORD-999999'))).toBeInstanceOf(OrdenNoEncontrada);
  });

  it('responde 409 si la orden ya estaba entregada', async () => {
    const e = await conTresParadas();
    valorDe(await e.entregarOrden.execute('ORD-000001'));

    const error = errorDe(await e.entregarOrden.execute('ORD-000001'));

    expect(error).toBeInstanceOf(TransicionEstadoInvalida);
    expect(error.httpStatus).toBe(409);
  });

  it('responde 409 si la orden sigue en cola', async () => {
    const e = crearEscenario();
    valorDe(await e.crearOrden.execute(orden(1)));

    expect(errorDe(await e.entregarOrden.execute('ORD-000001'))).toBeInstanceOf(TransicionEstadoInvalida);
  });

  it('si un paso falla revierte toda la entrega', async () => {
    const e = await conTresParadas();
    valorDe(await e.iniciarRuta.execute('ORD-000001'));
    e.ordenes.fallarEn = 'actualizarSecuencias';

    errorDe(await e.entregarOrden.execute('ORD-000001'));

    expect(e.base.orden('ORD-000001').estado).toBe('EN_RUTA');
    expect(e.base.repartidor(1)).toMatchObject({ lat: 0, lng: 0 });
    expect(estados(e, 'ORD-000001')).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA', 'EN_RUTA']);
  });
});
