import axios from 'axios';
import { CORREO, crearBitacora, iniciarSesion, type Sesion } from '../support/api';
import { cerrarConexiones, reiniciarDatos } from '../support/base-datos';

/**
 * Flujo completo contra el servicio real, PostgreSQL y Redis:
 * crear una orden → asignación automática → ruta optimizada → salida a ruta →
 * entregas → repartidor disponible de nuevo → consulta del cliente.
 */
describe('Flujo completo de una orden', () => {
  const { step, expectOkResponse } = crearBitacora('FLUJO');
  let cliente: Sesion;
  let bruno: Sesion;
  let admin: Sesion;

  beforeAll(async () => {
    await reiniciarDatos();
    cliente = await iniciarSesion(CORREO.cliente);
    bruno = await iniciarSesion(CORREO.bruno);
    admin = await iniciarSesion(CORREO.admin);
  });

  afterAll(cerrarConexiones);

  it('recorre el ciclo de vida de una orden de principio a fin', async () => {
    // La orden va a Zona 9: Bruno (Zona 10) está a ~1.7 km y Ana (Zona 1) a ~4.2 km.
    const destino = { lat: 14.605, lng: -90.522, peso: 2.5, direccion: 'Zona 9, Ciudad de Guatemala' };

    step('El cliente crea una orden con destino en Zona 9', destino);
    const creada = await axios.post('/api/ordenes', destino, cliente);
    expectOkResponse('POST /api/ordenes', creada);
    expect(creada.status).toBe(201);
    expect(creada.data).toMatchObject({ statusCode: 201, code: 'CREATED' });
    expect(creada.data.message).toBe('Orden ORD-000006 registrada y asignada a Bruno Castillo.');
    expect(creada.data.data).toMatchObject({
      folio: 'ORD-000006',
      estado: 'ASIGNADA',
      estadoDescripcion: 'Asignada',
      repartidor: { id: 2, nombre: 'Bruno Castillo' },
      peso: 2.5,
    });
    const folio: string = creada.data.data.folio;

    step('La ruta de Bruno queda reordenada con la parada nueva');
    const ruta = await axios.get('/api/repartidores/2/ruta', bruno);
    expectOkResponse('GET /api/repartidores/2/ruta', ruta);
    expect(ruta.data.paradas.map((p: { folio: string }) => p.folio)).toEqual(['ORD-000005', folio]);
    expect(ruta.data.paradas.map((p: { secuencia: number }) => p.secuencia)).toEqual([1, 2]);
    // Zona 10 → Zona 14 ≈ 1.49 km; Zona 14 → Zona 9 ≈ 2.27 km.
    expect(ruta.data.paradas[0].distanciaDesdeAnteriorKm).toBeCloseTo(1.49, 1);
    expect(ruta.data.paradas[1].distanciaDesdeAnteriorKm).toBeCloseTo(2.27, 1);
    expect(ruta.data.distanciaTotalKm).toBeCloseTo(
      ruta.data.paradas[0].distanciaDesdeAnteriorKm + ruta.data.paradas[1].distanciaDesdeAnteriorKm,
      1,
    );
    expect(ruta.data.repartidor).toMatchObject({ estado: 'DISPONIBLE', cargaKg: 10.5, capacidadKg: 60 });

    step('Bruno sale a ruta');
    const salida = await axios.patch('/api/ordenes/ORD-000005/estado', { estado: 'EN_RUTA' }, bruno);
    expectOkResponse('PATCH EN_RUTA', salida);
    expect(salida.status).toBe(200);
    expect(salida.data.message).toBe('Ruta iniciada con 2 parada(s) en camino.');
    expect(salida.data.data.estado).toBe('EN_RUTA');

    step('La orden del cliente también quedó En Ruta');
    const enRuta = await axios.get(`/api/ordenes/${folio}`, cliente);
    expectOkResponse('GET /api/ordenes/{folio}', enRuta);
    expect(enRuta.data.estado).toBe('EN_RUTA');

    step('Bruno entrega la primera parada');
    const primera = await axios.patch('/api/ordenes/ORD-000005/estado', { estado: 'ENTREGADA' }, bruno);
    expectOkResponse('PATCH ENTREGADA (ORD-000005)', primera);
    expect(primera.data.message).toBe('Orden ORD-000005 marcada como entregada.');

    step('La ruta se acorta y parte de la posición nueva de Bruno');
    const rutaRestante = await axios.get('/api/repartidores/2/ruta', bruno);
    expectOkResponse('GET /api/repartidores/2/ruta', rutaRestante);
    expect(rutaRestante.data.paradas.map((p: { folio: string }) => p.folio)).toEqual([folio]);
    expect(rutaRestante.data.paradas[0]).toMatchObject({ secuencia: 1, estado: 'EN_RUTA' });
    // Bruno está ahora en el destino de ORD-000005 (Zona 14).
    expect(rutaRestante.data.repartidor).toMatchObject({ estado: 'EN_RUTA', lat: 14.587, lng: -90.512, cargaKg: 2.5 });

    step('Bruno entrega la última parada y completa su ruta');
    const ultima = await axios.patch(`/api/ordenes/${folio}/estado`, { estado: 'ENTREGADA' }, bruno);
    expectOkResponse(`PATCH ENTREGADA (${folio})`, ultima);
    expect(ultima.data.message).toBe(`Orden ${folio} marcada como entregada. Completaste tu ruta.`);

    step('Bruno vuelve a estar Disponible, sin carga, en su última entrega');
    const repartidores = await axios.get('/api/repartidores', admin);
    expectOkResponse('GET /api/repartidores', repartidores);
    expect(repartidores.data.find((r: { id: number }) => r.id === 2)).toMatchObject({
      estado: 'DISPONIBLE',
      cargaKg: 0,
      paradasPendientes: 0,
      lat: 14.605,
      lng: -90.522,
    });

    step('El cliente ve el historial completo con la fecha de cada cambio');
    const detalle = await axios.get(`/api/ordenes/${folio}`, cliente);
    expectOkResponse('GET /api/ordenes/{folio}', detalle);
    expect(detalle.data).toMatchObject({ estado: 'ENTREGADA', estadoDescripcion: 'Entregada', secuenciaRuta: null });
    const historial: Array<{ estadoDescripcion: string; fecha: string }> = detalle.data.historial;
    expect(historial.map((h) => h.estadoDescripcion)).toEqual(['Pendiente de Asignación', 'Asignada', 'En Ruta', 'Entregada']);
    const fechas = historial.map((h) => Date.parse(h.fecha));
    expect(fechas.every((fecha) => !Number.isNaN(fecha))).toBe(true);
    expect([...fechas].sort((a, b) => a - b)).toEqual(fechas);

    step('El listado del cliente filtra por estado y pagina');
    const entregadas = await axios.get('/api/ordenes?estado=ENTREGADA&page=1&limit=2', cliente);
    expectOkResponse('GET /api/ordenes?estado=ENTREGADA', entregadas);
    expect(entregadas.data.meta).toEqual({ total: 3, page: 1, limit: 2, totalPages: 2, hasNextPage: true, hasPreviousPage: false });
    expect(entregadas.data.data).toHaveLength(2);
    expect(entregadas.data.data.every((o: { estado: string }) => o.estado === 'ENTREGADA')).toBe(true);
  });

  it('la ruta se sirve desde caché hasta que cambia', async () => {
    await reiniciarDatos();

    step('Dos lecturas seguidas devuelven la misma ruta calculada');
    const primera = await axios.get('/api/repartidores/1/ruta', admin);
    const segunda = await axios.get('/api/repartidores/1/ruta', admin);
    expectOkResponse('GET /api/repartidores/1/ruta', segunda);
    expect(segunda.data.calculadaEn).toBe(primera.data.calculadaEn);

    step('Una orden nueva para Ana invalida su ruta en caché');
    const creada = await axios.post('/api/ordenes', { lat: 14.6417, lng: -90.5133, peso: 1 }, cliente);
    expectOkResponse('POST /api/ordenes', creada);
    expect(creada.data.data.repartidor.id).toBe(1);

    const tercera = await axios.get('/api/repartidores/1/ruta', admin);
    expectOkResponse('GET /api/repartidores/1/ruta', tercera);
    expect(tercera.data.calculadaEn).not.toBe(primera.data.calculadaEn);
    expect(tercera.data.totalParadas).toBe(primera.data.totalParadas + 1);
    // La parada nueva está donde está Ana: pasa a ser la primera.
    expect(tercera.data.paradas[0]).toMatchObject({ folio: creada.data.data.folio, distanciaDesdeAnteriorKm: 0 });
  });
});
