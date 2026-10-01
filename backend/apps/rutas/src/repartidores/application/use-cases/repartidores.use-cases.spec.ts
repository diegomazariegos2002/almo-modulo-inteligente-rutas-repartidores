import { crearEscenario, errorDe, type Escenario, valorDe } from '../../../testing/escenario.fakes';
import { RepartidorNoEncontrado } from '../../domain/exceptions';

const orden = (lng: number, peso = 5) => ({ clienteId: 'cli-1', lat: 0, lng, peso });

async function conRuta(): Promise<Escenario> {
  const e = crearEscenario();
  e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, nombre: 'Ana López' }).agregarRepartidor({ id: 2, lat: 0, lng: 20 });
  valorDe(await e.crearOrden.execute(orden(3)));
  valorDe(await e.crearOrden.execute(orden(1, 2.5)));
  return e;
}

describe('ObtenerRutaRepartidorUseCase', () => {
  it('devuelve las paradas pendientes en el orden optimizado, con la distancia de cada tramo', async () => {
    const e = await conRuta();

    const ruta = valorDe(await e.obtenerRuta.execute(1));

    expect(ruta.paradas.map((p) => [p.secuencia, p.folio])).toEqual([
      [1, 'ORD-000002'],
      [2, 'ORD-000001'],
    ]);
    // 1° de longitud en el ecuador ≈ 111.19 km; luego 2° más.
    expect(ruta.paradas[0]?.distanciaDesdeAnteriorKm).toBeCloseTo(111.19, 1);
    expect(ruta.paradas[1]?.distanciaDesdeAnteriorKm).toBeCloseTo(222.39, 1);
    expect(ruta.distanciaTotalKm).toBeCloseTo(333.58, 1);
    expect(ruta.totalParadas).toBe(2);
  });

  it('incluye el estado y la carga del repartidor', async () => {
    const e = await conRuta();

    const ruta = valorDe(await e.obtenerRuta.execute(1));

    expect(ruta.repartidor).toEqual({ id: 1, nombre: 'Ana López', estado: 'DISPONIBLE', lat: 0, lng: 0, capacidadKg: 50, cargaKg: 7.5 });
  });

  it('un repartidor sin paradas tiene una ruta vacía, no un error', async () => {
    const e = await conRuta();

    const ruta = valorDe(await e.obtenerRuta.execute(2));

    expect(ruta).toMatchObject({ paradas: [], totalParadas: 0, distanciaTotalKm: 0 });
  });

  it('las paradas entregadas dejan de aparecer', async () => {
    const e = await conRuta();
    valorDe(await e.entregarOrden.execute('ORD-000002'));

    const ruta = valorDe(await e.obtenerRuta.execute(1));

    expect(ruta.paradas.map((p) => p.folio)).toEqual(['ORD-000001']);
    expect(ruta.paradas[0]).toMatchObject({ secuencia: 1, estado: 'EN_RUTA' });
  });

  it('responde 404 con un mensaje amigable si el repartidor no existe', async () => {
    const e = await conRuta();

    const error = errorDe(await e.obtenerRuta.execute(99));

    expect(error).toBeInstanceOf(RepartidorNoEncontrado);
    expect(error.httpStatus).toBe(404);
    expect(error.message).toBe('No existe un repartidor con el id 99.');
  });

  describe('caché', () => {
    it('guarda la ruta calculada y la reutiliza sin volver a consultar', async () => {
      const e = await conRuta();
      const findById = jest.spyOn(e.repartidores, 'findById');
      const findParadas = jest.spyOn(e.repartidores, 'findParadasPendientes');

      const primera = valorDe(await e.obtenerRuta.execute(1));
      const segunda = valorDe(await e.obtenerRuta.execute(1));

      expect(segunda).toBe(primera);
      expect(findById).toHaveBeenCalledTimes(1);
      expect(findParadas).toHaveBeenCalledTimes(1);
    });

    it('tras asignar una orden nueva, la ruta en caché se descarta y se recalcula', async () => {
      const e = await conRuta();
      valorDe(await e.obtenerRuta.execute(1));

      valorDe(await e.crearOrden.execute(orden(2)));
      const ruta = valorDe(await e.obtenerRuta.execute(1));

      expect(ruta.paradas.map((p) => p.folio)).toEqual(['ORD-000002', 'ORD-000003', 'ORD-000001']);
    });

    it('tras una entrega, la ruta en caché se descarta y se recalcula', async () => {
      const e = await conRuta();
      valorDe(await e.obtenerRuta.execute(1));

      valorDe(await e.entregarOrden.execute('ORD-000002'));
      const ruta = valorDe(await e.obtenerRuta.execute(1));

      expect(ruta.totalParadas).toBe(1);
      expect(ruta.repartidor).toMatchObject({ lng: 1, estado: 'EN_RUTA' });
    });

    it('no guarda en caché la ruta de un repartidor inexistente', async () => {
      const e = await conRuta();

      await e.obtenerRuta.execute(99);

      expect(e.cache.entradas.has(99)).toBe(false);
    });
  });
});

describe('ListarRepartidoresUseCase', () => {
  it('lista todos los repartidores por id con su carga y paradas pendientes', async () => {
    const e = await conRuta();

    const repartidores = valorDe(await e.listarRepartidores.execute());

    expect(repartidores.map((r) => [r.id, r.estado, r.cargaKg, r.paradasPendientes])).toEqual([
      [1, 'DISPONIBLE', 7.5, 2],
      [2, 'DISPONIBLE', 0, 0],
    ]);
  });
});
