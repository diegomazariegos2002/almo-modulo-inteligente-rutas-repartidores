import { ROLES } from '@almo/security/constants';
import type { Solicitante } from '../../../shared/application/solicitante';
import { ESTADO_REPARTIDOR } from '../../../repartidores/domain/value-objects/estado-repartidor.vo';
import { crearEscenario, errorDe, type Escenario, valorDe } from '../../../testing/escenario.fakes';
import { OrdenNoEncontrada } from '../../domain/exceptions';

const admin: Solicitante = { usuarioId: 'adm-1', rol: ROLES.ADMIN, repartidorId: null };
const clienteA: Solicitante = { usuarioId: 'cli-a', rol: ROLES.CLIENTE, repartidorId: null };
const clienteB: Solicitante = { usuarioId: 'cli-b', rol: ROLES.CLIENTE, repartidorId: null };
const repartidor1: Solicitante = { usuarioId: 'usu-r1', rol: ROLES.REPARTIDOR, repartidorId: 1 };
const repartidor2: Solicitante = { usuarioId: 'usu-r2', rol: ROLES.REPARTIDOR, repartidorId: 2 };

/**
 * Repartidor 1 (lng 0) y repartidor 2 (lng 20).
 *  ORD-1 cliente A → repartidor 1      ORD-2 cliente B → repartidor 2
 *  ORD-3 cliente A → repartidor 1      ORD-4 cliente A → en cola (no le cabe a nadie)
 */
async function escenarioConOrdenes(): Promise<Escenario> {
  const e = crearEscenario();
  e.base.agregarRepartidor({ id: 1, lat: 0, lng: 0, capacidadKg: 10 }).agregarRepartidor({ id: 2, lat: 0, lng: 20, capacidadKg: 10 });
  valorDe(await e.crearOrden.execute({ clienteId: 'cli-a', lat: 0, lng: 1, peso: 5 }));
  valorDe(await e.crearOrden.execute({ clienteId: 'cli-b', lat: 0, lng: 19, peso: 5 }));
  valorDe(await e.crearOrden.execute({ clienteId: 'cli-a', lat: 0, lng: 2, peso: 5 }));
  valorDe(await e.crearOrden.execute({ clienteId: 'cli-a', lat: 0, lng: 3, peso: 9 }));
  return e;
}

describe('ListarOrdenesUseCase', () => {
  const folios = (listado: { ordenes: { folio: string }[] }): string[] => listado.ordenes.map((o) => o.folio).sort();

  it('el despacho (ADMIN) ve todas las órdenes', async () => {
    const e = await escenarioConOrdenes();

    const listado = valorDe(await e.listarOrdenes.execute({ solicitante: admin, page: 1, limit: 10 }));

    expect(listado.total).toBe(4);
    expect(folios(listado)).toEqual(['ORD-000001', 'ORD-000002', 'ORD-000003', 'ORD-000004']);
  });

  it('un cliente solo ve las órdenes que él creó', async () => {
    const e = await escenarioConOrdenes();

    expect(folios(valorDe(await e.listarOrdenes.execute({ solicitante: clienteA, page: 1, limit: 10 })))).toEqual([
      'ORD-000001',
      'ORD-000003',
      'ORD-000004',
    ]);
    expect(folios(valorDe(await e.listarOrdenes.execute({ solicitante: clienteB, page: 1, limit: 10 })))).toEqual(['ORD-000002']);
  });

  it('un repartidor solo ve las órdenes que tiene asignadas', async () => {
    const e = await escenarioConOrdenes();

    expect(folios(valorDe(await e.listarOrdenes.execute({ solicitante: repartidor1, page: 1, limit: 10 })))).toEqual([
      'ORD-000001',
      'ORD-000003',
    ]);
    expect(folios(valorDe(await e.listarOrdenes.execute({ solicitante: repartidor2, page: 1, limit: 10 })))).toEqual(['ORD-000002']);
  });

  it('un usuario repartidor sin repartidor vinculado no ve ninguna orden', async () => {
    const e = await escenarioConOrdenes();
    const sinVinculo: Solicitante = { usuarioId: 'usu-x', rol: ROLES.REPARTIDOR, repartidorId: null };

    const listado = valorDe(await e.listarOrdenes.execute({ solicitante: sinVinculo, page: 2, limit: 5 }));

    expect(listado).toEqual({ ordenes: [], total: 0, page: 2, limit: 5 });
  });

  it('filtra por estado dentro del alcance del solicitante', async () => {
    const e = await escenarioConOrdenes();

    const enCola = valorDe(await e.listarOrdenes.execute({ solicitante: admin, estado: 'PENDIENTE_ASIGNACION', page: 1, limit: 10 }));
    const asignadasDeB = valorDe(await e.listarOrdenes.execute({ solicitante: clienteB, estado: 'ASIGNADA', page: 1, limit: 10 }));
    const enColaDeB = valorDe(await e.listarOrdenes.execute({ solicitante: clienteB, estado: 'PENDIENTE_ASIGNACION', page: 1, limit: 10 }));

    expect(folios(enCola)).toEqual(['ORD-000004']);
    expect(folios(asignadasDeB)).toEqual(['ORD-000002']);
    expect(enColaDeB.total).toBe(0);
  });

  it('pagina y devuelve el total sin importar la página pedida', async () => {
    const e = await escenarioConOrdenes();

    const pagina1 = valorDe(await e.listarOrdenes.execute({ solicitante: admin, page: 1, limit: 3 }));
    const pagina2 = valorDe(await e.listarOrdenes.execute({ solicitante: admin, page: 2, limit: 3 }));
    const fueraDeRango = valorDe(await e.listarOrdenes.execute({ solicitante: admin, page: 9, limit: 3 }));

    expect(pagina1).toMatchObject({ total: 4, page: 1, limit: 3 });
    expect(pagina1.ordenes).toHaveLength(3);
    expect(pagina2.ordenes).toHaveLength(1);
    expect(fueraDeRango).toMatchObject({ ordenes: [], total: 4, page: 9 });
  });

  it('ordena de la más reciente a la más antigua', async () => {
    const e = await escenarioConOrdenes();
    e.base.ordenes.forEach((o, i) => (o.creadaEn = new Date(2026, 8, 30, 10, i)));

    const listado = valorDe(await e.listarOrdenes.execute({ solicitante: admin, page: 1, limit: 10 }));

    expect(listado.ordenes.map((o) => o.folio)).toEqual(['ORD-000004', 'ORD-000003', 'ORD-000002', 'ORD-000001']);
  });
});

describe('ObtenerOrdenUseCase', () => {
  it('devuelve la orden con su historial', async () => {
    const e = await escenarioConOrdenes();

    const orden = valorDe(await e.obtenerOrden.execute('ORD-000001'));

    expect(orden).toMatchObject({ folio: 'ORD-000001', estado: 'ASIGNADA', repartidor: { id: 1 } });
    expect(orden.historial).toHaveLength(2);
  });

  it('responde 404 con un mensaje amigable si el folio no existe', async () => {
    const e = await escenarioConOrdenes();

    const error = errorDe(await e.obtenerOrden.execute('ORD-999999'));

    expect(error).toBeInstanceOf(OrdenNoEncontrada);
    expect(error.httpStatus).toBe(404);
    expect(error.code).toBe('RUTAS.ORDEN_NO_ENCONTRADA');
    expect(error.message).toBe('No existe una orden con el folio ORD-999999.');
  });

  it('propaga un fallo de persistencia sin convertirlo en 404', async () => {
    const e = await escenarioConOrdenes();
    e.ordenes.fallarEn = 'findByFolio';

    expect(errorDe(await e.obtenerOrden.execute('ORD-000001')).httpStatus).toBe(500);
  });
});

describe('repartidor en ruta en el listado', () => {
  it('refleja el estado En Ruta de las órdenes tras la salida', async () => {
    const e = await escenarioConOrdenes();
    valorDe(await e.iniciarRuta.execute('ORD-000001'));

    const enRuta = valorDe(await e.listarOrdenes.execute({ solicitante: repartidor1, estado: 'EN_RUTA', page: 1, limit: 10 }));

    expect(enRuta.total).toBe(2);
    expect(e.base.repartidor(1).estado).toBe(ESTADO_REPARTIDOR.EN_RUTA);
  });
});
