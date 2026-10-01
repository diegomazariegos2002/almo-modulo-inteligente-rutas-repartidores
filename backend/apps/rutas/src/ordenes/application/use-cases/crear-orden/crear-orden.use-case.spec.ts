import { EntradaInvalidaError } from '@almo/exceptions';
import { ESTADO_REPARTIDOR } from '../../../../repartidores/domain/value-objects/estado-repartidor.vo';
import { RutasPersistenceError } from '../../../../shared/domain/exceptions/rutas-persistence.exception';
import { crearEscenario, errorDe, type Escenario, valorDe } from '../../../../testing/escenario.fakes';

/*
 * Rejilla cerca del ecuador: todos están en lat 0 y solo cambia la longitud,
 * así "más cerca" se lee directo en los números.
 */
const cliente = 'cli-1';
const orden = (lng: number, peso = 5, lat = 0) => ({ clienteId: cliente, lat, lng, peso });

describe('CrearOrdenUseCase', () => {
  let e: Escenario;

  beforeEach(() => {
    e = crearEscenario();
  });

  describe('asignación automática', () => {
    it('asigna la orden al repartidor disponible más cercano a su destino', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 }).agregarRepartidor({ id: 2, lat: 0, lng: 10 });

      const creada = valorDe(await e.crearOrden.execute(orden(8)));

      expect(creada.estado).toBe('ASIGNADA');
      expect(creada.repartidor).toEqual({ id: 2, nombre: 'Repartidor 2' });
      expect(creada.secuenciaRuta).toBe(1);
      expect(creada.folio).toBe('ORD-000001');
    });

    it('registra en el historial la creación y la asignación con su fecha', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });

      const creada = valorDe(await e.crearOrden.execute(orden(1)));

      expect(creada.historial.map((h) => [h.estado, h.repartidorId])).toEqual([
        ['PENDIENTE_ASIGNACION', null],
        ['ASIGNADA', 1],
      ]);
      expect(creada.historial.every((h) => h.fecha instanceof Date)).toBe(true);
    });

    it('no considera a un repartidor que está en ruta, aunque sea el más cercano', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 1, estado: ESTADO_REPARTIDOR.EN_RUTA }).agregarRepartidor({ id: 2, lat: 0, lng: 9 });

      const creada = valorDe(await e.crearOrden.execute(orden(0)));

      expect(creada.repartidor?.id).toBe(2);
    });

    it('si al más cercano no le cabe el paquete, pasa al siguiente más cercano', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 1, capacidadKg: 10 }).agregarRepartidor({ id: 2, lat: 0, lng: 5 });
      valorDe(await e.crearOrden.execute(orden(0, 8))); // llena casi por completo al repartidor 1

      const creada = valorDe(await e.crearOrden.execute(orden(0, 5)));

      expect(creada.repartidor?.id).toBe(2);
    });

    it('guarda el peso y la referencia de dirección', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });

      const creada = valorDe(await e.crearOrden.execute({ ...orden(1, 4.456), direccion: '  Zona 4  ' }));

      expect(creada.pesoKg).toBe(4.46);
      expect(creada.direccion).toBe('Zona 4');
    });
  });

  describe('cola de órdenes pendientes', () => {
    it('deja la orden Pendiente de Asignación si no hay repartidores disponibles, sin tratarlo como error', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, estado: ESTADO_REPARTIDOR.EN_RUTA });

      const creada = valorDe(await e.crearOrden.execute(orden(1)));

      expect(creada.estado).toBe('PENDIENTE_ASIGNACION');
      expect(creada.repartidor).toBeNull();
      expect(creada.secuenciaRuta).toBeNull();
      expect(e.base.ordenes).toHaveLength(1);
    });

    it('deja la orden en cola si no existe ningún repartidor', async () => {
      const creada = valorDe(await e.crearOrden.execute(orden(1)));

      expect(creada.estado).toBe('PENDIENTE_ASIGNACION');
    });

    it('deja la orden en cola si a ningún repartidor disponible le cabe', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, capacidadKg: 10 });
      valorDe(await e.crearOrden.execute(orden(1, 8)));

      const creada = valorDe(await e.crearOrden.execute(orden(1, 5)));

      expect(creada.estado).toBe('PENDIENTE_ASIGNACION');
      expect(e.base.rutaDe(1)).toEqual(['ORD-000001']);
    });
  });

  describe('ruta optimizada', () => {
    it('recalcula el orden de las paradas cada vez que se asigna una orden', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });

      valorDe(await e.crearOrden.execute(orden(5)));
      expect(e.base.rutaDe(1)).toEqual(['ORD-000001']);

      valorDe(await e.crearOrden.execute(orden(2)));
      expect(e.base.rutaDe(1)).toEqual(['ORD-000002', 'ORD-000001']);

      valorDe(await e.crearOrden.execute(orden(3)));
      expect(e.base.rutaDe(1)).toEqual(['ORD-000002', 'ORD-000003', 'ORD-000001']);
    });

    it('devuelve la orden con la posición que le tocó, que no siempre es la última', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });
      valorDe(await e.crearOrden.execute(orden(5)));

      const masCercana = valorDe(await e.crearOrden.execute(orden(2)));

      expect(masCercana.secuenciaRuta).toBe(1);
      expect(e.base.orden('ORD-000001').secuenciaRuta).toBe(2);
    });

    it('solo reordena la ruta del repartidor que recibió la orden', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 }).agregarRepartidor({ id: 2, lat: 0, lng: 20 });
      valorDe(await e.crearOrden.execute(orden(1)));
      valorDe(await e.crearOrden.execute(orden(19)));

      valorDe(await e.crearOrden.execute(orden(2)));

      expect(e.base.rutaDe(1)).toEqual(['ORD-000001', 'ORD-000003']);
      expect(e.base.rutaDe(2)).toEqual(['ORD-000002']);
    });
  });

  describe('validación de la entrada', () => {
    it.each([
      ['latitud fuera de rango', { ...orden(1), lat: 91 }, ['lat']],
      ['longitud fuera de rango', { ...orden(181) }, ['lng']],
      ['peso en cero', orden(1, 0), ['peso']],
      ['peso negativo', orden(1, -3), ['peso']],
      ['peso por encima del máximo', orden(1, 50.5), ['peso']],
      ['todo inválido', { clienteId: cliente, lat: Number.NaN, lng: 500, peso: -1 }, ['lat', 'lng', 'peso']],
    ])('rechaza %s con un detalle por campo y no registra nada', async (_caso, cmd, campos) => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });

      const error = errorDe(await e.crearOrden.execute(cmd));

      expect(error).toBeInstanceOf(EntradaInvalidaError);
      expect(error.httpStatus).toBe(400);
      expect(error.details?.map((d) => d.campo)).toEqual(campos);
      expect(e.base.ordenes).toHaveLength(0);
      expect(e.bloqueo.adquisiciones).toBe(0);
    });
  });

  describe('concurrencia y atomicidad', () => {
    it('adquiere el bloqueo de despacho en cada creación, dentro de la transacción', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });

      await e.crearOrden.execute(orden(1));
      await e.crearOrden.execute(orden(2));

      // El doble del bloqueo lanza si se adquiere fuera de una transacción.
      expect(e.bloqueo.adquisiciones).toBe(2);
    });

    it('si un paso falla revierte todo: la orden no queda registrada ni asignada a medias', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 });
      e.ordenes.fallarEn = 'actualizarSecuencias';

      const error = errorDe(await e.crearOrden.execute(orden(1)));

      expect(error).toBeInstanceOf(RutasPersistenceError);
      expect(e.base.ordenes).toHaveLength(0);
      expect(e.cache.invalidaciones).toHaveLength(0);
    });

    it('varias órdenes simultáneas nunca exceden la capacidad de un repartidor', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, capacidadKg: 20 });

      const creadas = await Promise.all(Array.from({ length: 8 }, (_, i) => e.crearOrden.execute(orden(i + 1, 6))));

      const asignadas = creadas.map(valorDe).filter((o) => o.estado === 'ASIGNADA');
      expect(asignadas).toHaveLength(3); // 3 × 6 kg = 18 kg ≤ 20 kg
      expect(e.base.ordenes.filter((o) => o.estado === 'PENDIENTE_ASIGNACION')).toHaveLength(5);
      expect(e.base.rutaDe(1)).toHaveLength(3);
    });

    it('varias órdenes simultáneas dejan la ruta con secuencias 1..n sin huecos ni repetidos', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, capacidadKg: 50 });

      await Promise.all(Array.from({ length: 6 }, (_, i) => e.crearOrden.execute(orden(6 - i, 5))));

      const secuencias = e.base.paradasDe(1).map((o) => o.secuenciaRuta);
      expect(secuencias).toEqual([1, 2, 3, 4, 5, 6]);
      // Todas en la misma dirección: la ruta óptima es de la más cercana a la más lejana.
      expect(e.base.paradasDe(1).map((o) => o.lng)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('CONTRAPRUEBA: sin el bloqueo, las órdenes simultáneas sí exceden la capacidad', async () => {
      const sinBloqueo = crearEscenario({ sinExclusion: true });
      sinBloqueo.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, capacidadKg: 20 });

      await Promise.all(Array.from({ length: 8 }, (_, i) => sinBloqueo.crearOrden.execute(orden(i + 1, 6))));

      // Todas leyeron "0 kg de carga" antes de que alguna escribiera: por eso existe el bloqueo.
      const cargaKg = sinBloqueo.base.paradasDe(1).reduce((total, o) => total + o.pesoKg, 0);
      expect(cargaKg).toBeGreaterThan(20);
    });
  });

  describe('caché de la ruta', () => {
    it('invalida el caché del repartidor que recibió la orden', async () => {
      e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0 }).agregarRepartidor({ id: 2, lat: 0, lng: 10 });

      await e.crearOrden.execute(orden(9));

      expect(e.cache.invalidaciones).toEqual([[2]]);
    });

    it('no invalida nada si la orden quedó en cola', async () => {
      await e.crearOrden.execute(orden(1));

      expect(e.cache.invalidaciones).toEqual([]);
    });
  });
});
