import axios, { type AxiosResponse } from 'axios';
import { CORREO, crearBitacora, iniciarSesion, type Sesion } from '../support/api';
import { cerrarConexiones, reiniciarDatos } from '../support/base-datos';

interface OrdenApi {
  folio: string;
  estado: string;
  peso: number;
  repartidor: { id: number; nombre: string } | null;
  secuenciaRuta: number | null;
  historial: Array<{ estado: string }>;
}

interface RepartidorApi {
  id: number;
  estado: string;
  capacidadKg: number;
  cargaKg: number;
  paradasPendientes: number;
}

describe('Cola de órdenes pendientes y concurrencia', () => {
  const { step, expectOkResponse } = crearBitacora('COLA');
  let cliente: Sesion;
  let ana: Sesion;
  let bruno: Sesion;
  let admin: Sesion;

  beforeAll(async () => {
    await reiniciarDatos();
    cliente = await iniciarSesion(CORREO.cliente);
    ana = await iniciarSesion(CORREO.ana);
    bruno = await iniciarSesion(CORREO.bruno);
    admin = await iniciarSesion(CORREO.admin);
  });

  beforeEach(reiniciarDatos);
  afterAll(cerrarConexiones);

  it('sin repartidores disponibles la orden queda en cola y se asigna sola cuando uno se libera', async () => {
    step('Ana y Bruno salen a ruta: ya no queda ningún repartidor disponible (Carla ya estaba en ruta)');
    expectOkResponse('Ana sale a ruta', await axios.patch('/api/ordenes/ORD-000003/estado', { estado: 'EN_RUTA' }, ana));
    expectOkResponse('Bruno sale a ruta', await axios.patch('/api/ordenes/ORD-000005/estado', { estado: 'EN_RUTA' }, bruno));

    step('El cliente crea una orden: se registra, pero queda Pendiente de Asignación');
    const creada = await axios.post('/api/ordenes', { lat: 14.5995, lng: -90.5069, peso: 4, direccion: 'Zona 10' }, cliente);
    expectOkResponse('POST /api/ordenes', creada);
    expect(creada.status).toBe(201); // no es un error
    expect(creada.data.message).toContain('Pendiente de Asignación');
    expect(creada.data.data).toMatchObject({ estado: 'PENDIENTE_ASIGNACION', repartidor: null, secuenciaRuta: null });
    const folio: string = creada.data.data.folio;

    step('La orden aparece en el listado filtrando por su estado');
    const enCola = await axios.get('/api/ordenes?estado=PENDIENTE_ASIGNACION', admin);
    expectOkResponse('GET /api/ordenes?estado=PENDIENTE_ASIGNACION', enCola);
    expect(enCola.data.data.map((o: OrdenApi) => o.folio)).toEqual([folio]);

    step('Bruno entrega su única parada: queda disponible y recibe la orden que esperaba');
    const entrega = await axios.patch('/api/ordenes/ORD-000005/estado', { estado: 'ENTREGADA' }, bruno);
    expectOkResponse('PATCH ENTREGADA (ORD-000005)', entrega);
    expect(entrega.data.message).toContain('Completaste tu ruta');

    const asignada = await axios.get(`/api/ordenes/${folio}`, cliente);
    expectOkResponse(`GET /api/ordenes/${folio}`, asignada);
    expect(asignada.data).toMatchObject({ estado: 'ASIGNADA', repartidor: { id: 2, nombre: 'Bruno Castillo' }, secuenciaRuta: 1 });
    expect(asignada.data.historial.map((h: { estado: string }) => h.estado)).toEqual(['PENDIENTE_ASIGNACION', 'ASIGNADA']);

    step('La ruta nueva de Bruno contiene esa orden');
    const ruta = await axios.get('/api/repartidores/2/ruta', bruno);
    expectOkResponse('GET /api/repartidores/2/ruta', ruta);
    expect(ruta.data.paradas.map((p: { folio: string }) => p.folio)).toEqual([folio]);
    expect(ruta.data.repartidor.estado).toBe('DISPONIBLE');
  });

  it('30 órdenes simultáneas no dejan ninguna asignación inconsistente', async () => {
    const TOTAL = 30;
    const PESO = 5;

    step(`Se envían ${TOTAL} órdenes a la vez, de ${PESO} kg, repartidas alrededor de la ciudad`);
    const respuestas: AxiosResponse[] = await Promise.all(
      Array.from({ length: TOTAL }, (_, i) =>
        axios.post(
          '/api/ordenes',
          { lat: 14.58 + (i % 6) * 0.012, lng: -90.56 + (i % 5) * 0.015, peso: PESO, direccion: `Concurrente ${i + 1}` },
          cliente,
        ),
      ),
    );

    step('Todas se registran (201): asignadas o en cola, ninguna falla');
    const estados = respuestas.map((res) => res.status);
    expect(estados.filter((estado) => estado !== 201)).toEqual([]);
    const nuevas: OrdenApi[] = respuestas.map((res) => res.data.data);

    step('Los folios son únicos');
    expect(new Set(nuevas.map((o) => o.folio)).size).toBe(TOTAL);

    const repartidores: RepartidorApi[] = (await axios.get('/api/repartidores', admin)).data;
    const listado = await axios.get('/api/ordenes?limit=100', admin);
    const todas: OrdenApi[] = listado.data.data;
    console.debug('  → repartidores tras la ráfaga', JSON.stringify(repartidores));

    step('Ningún repartidor quedó con más carga que su capacidad');
    for (const repartidor of repartidores) {
      expect(repartidor.cargaKg).toBeLessThanOrEqual(repartidor.capacidadKg);
    }

    step('Se llenó toda la capacidad posible: 8 órdenes más para Ana y 10 para Bruno; el resto, a la cola');
    // Ana: 50 kg − 7.5 kg = 42.5 kg libres → 8 × 5 kg.   Bruno: 60 kg − 8 kg = 52 kg libres → 10 × 5 kg.
    const asignadas = nuevas.filter((o) => o.estado === 'ASIGNADA');
    const enCola = nuevas.filter((o) => o.estado === 'PENDIENTE_ASIGNACION');
    expect(asignadas).toHaveLength(18);
    expect(enCola).toHaveLength(12);
    expect(asignadas.filter((o) => o.repartidor?.id === 1)).toHaveLength(8);
    expect(asignadas.filter((o) => o.repartidor?.id === 2)).toHaveLength(10);
    expect(repartidores.find((r) => r.id === 1)).toMatchObject({ cargaKg: 47.5, paradasPendientes: 10 });
    expect(repartidores.find((r) => r.id === 2)).toMatchObject({ cargaKg: 58, paradasPendientes: 11 });
    // Carla está en ruta: no recibe nada.
    expect(asignadas.some((o) => o.repartidor?.id === 3)).toBe(false);

    step('La ruta de cada repartidor quedó numerada 1..n, sin huecos ni repetidos');
    for (const id of [1, 2]) {
      const ruta = await axios.get(`/api/repartidores/${id}/ruta`, admin);
      const secuencias: number[] = ruta.data.paradas.map((p: { secuencia: number }) => p.secuencia);
      const folios: string[] = ruta.data.paradas.map((p: { folio: string }) => p.folio);

      expect(secuencias).toEqual(Array.from({ length: secuencias.length }, (_, i) => i + 1));
      expect(new Set(folios).size).toBe(folios.length);

      // Lo que dice la ruta coincide con lo guardado en cada orden.
      const guardadas = todas.filter((o) => o.repartidor?.id === id && o.secuenciaRuta !== null);
      expect(guardadas.map((o) => o.secuenciaRuta).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(secuencias);
    }

    step('Cada orden tiene un historial coherente con su estado');
    for (const orden of todas.filter((o) => nuevas.some((n) => n.folio === o.folio))) {
      const esperado = orden.estado === 'ASIGNADA' ? ['PENDIENTE_ASIGNACION', 'ASIGNADA'] : ['PENDIENTE_ASIGNACION'];
      expect(orden.historial.map((h) => h.estado)).toEqual(esperado);
    }
  });

  it('dos entregas simultáneas de la misma parada: una gana, la otra recibe 409', async () => {
    step('Ana sale a ruta y envía dos veces la entrega de ORD-000003 al mismo tiempo');
    expectOkResponse('Ana sale a ruta', await axios.patch('/api/ordenes/ORD-000003/estado', { estado: 'EN_RUTA' }, ana));

    const [a, b] = await Promise.all([
      axios.patch('/api/ordenes/ORD-000003/estado', { estado: 'ENTREGADA' }, ana),
      axios.patch('/api/ordenes/ORD-000003/estado', { estado: 'ENTREGADA' }, ana),
    ]);

    expect([a.status, b.status].sort()).toEqual([200, 409]);

    const detalle = await axios.get('/api/ordenes/ORD-000003', ana);
    // Una sola entrega registrada en el historial.
    expect(detalle.data.historial.filter((h: { estado: string }) => h.estado === 'ENTREGADA')).toHaveLength(1);
  });
});
