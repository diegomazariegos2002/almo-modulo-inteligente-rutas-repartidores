import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ESTADO_REPARTIDOR } from '../repartidores/domain/value-objects/estado-repartidor.vo';
import { crearAppDePrueba, CUENTAS, type NombreCuenta, PASSWORD_PRUEBA } from '../testing/app-http.fakes';
import type { BaseEnMemoria, RutaCacheEnMemoria } from '../testing/en-memoria.fakes';

/*
 * Prueba de integración de la frontera HTTP: peticiones reales (supertest) contra
 * el servicio completo en el mismo proceso, con persistencia en memoria. Verifica
 * lo que las pruebas unitarias no ven: rutas, guards, validación, códigos de
 * estado y la forma exacta de las respuestas.
 */
describe('API de rutas (integración HTTP)', () => {
  let app: INestApplication;
  let base: BaseEnMemoria;
  let cache: RutaCacheEnMemoria;
  const tokens = {} as Record<NombreCuenta, string>;

  const http = () => request(app.getHttpServer());
  const como = (cuenta: NombreCuenta) => ({ Authorization: `Bearer ${tokens[cuenta]}` });
  const zona = (lng: number, peso = 5) => ({ lat: 0, lng, peso });

  // La aplicación se levanta una vez; cada prueba parte de una base vacía con dos repartidores.
  beforeAll(async () => {
    ({ app, base, cache } = await crearAppDePrueba());

    for (const nombre of Object.keys(CUENTAS) as NombreCuenta[]) {
      if (nombre === 'inactivo') continue;
      const res = await http().post('/api/auth/login').send({ correo: CUENTAS[nombre].correo, password: PASSWORD_PRUEBA });
      tokens[nombre] = res.body.accessToken;
    }
  });

  beforeEach(() => {
    base.vaciar();
    cache.vaciar();
    // Repartidor 1 en lng 0 y repartidor 2 en lng 20: "más cerca" se lee en los números.
    base
      .agregarRepartidor({ id: 1, nombre: 'Ana López', lat: 0, lng: 0 })
      .agregarRepartidor({ id: 2, nombre: 'Bruno Castillo', lat: 0, lng: 20 });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('200: devuelve el token y los datos del usuario con los permisos de su rol', async () => {
      const res = await http().post('/api/auth/login').send({ correo: CUENTAS.repartidor1.correo, password: PASSWORD_PRUEBA });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuario: {
          id: 'usu-repartidor-1',
          rol: 'REPARTIDOR',
          repartidorId: 1,
          permisos: ['rutas:orden:listar', 'rutas:orden:cambiar-estado', 'rutas:ruta:leer'],
        },
      });
      expect(res.body.accessToken.split('.')).toHaveLength(3);
      expect(JSON.stringify(res.body)).not.toContain('scrypt$');
    });

    it('401: contraseña incorrecta, correo desconocido y cuenta inactiva responden lo mismo', async () => {
      const intentos = [
        { correo: CUENTAS.clienteA.correo, password: 'incorrecta' },
        { correo: 'nadie@prueba.test', password: PASSWORD_PRUEBA },
        { correo: CUENTAS.inactivo.correo, password: PASSWORD_PRUEBA },
      ];

      for (const intento of intentos) {
        const res = await http().post('/api/auth/login').send(intento);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
          statusCode: 401,
          code: 'AUTH.CREDENCIALES_INVALIDAS',
          message: 'Correo o contraseña incorrectos.',
        });
      }
    });

    it('400: valida la forma del cuerpo', async () => {
      const res = await http().post('/api/auth/login').send({ correo: 'no-es-un-correo' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDACION.ENTRADA_INVALIDA');
      expect(res.body.details.map((d: { campo: string }) => d.campo)).toEqual(['correo', 'password']);
    });
  });

  describe('autenticación y permisos por rol', () => {
    it('401: sin token, con token mal formado o con firma inválida', async () => {
      const [cabecera, cuerpo] = tokens.clienteA.split('.');
      const firmaFalsa = `${cabecera}.${cuerpo}.firma-inventada`;

      for (const authorization of [undefined, 'Bearer no-es-un-jwt', `Bearer ${firmaFalsa}`, `Basic ${tokens.clienteA}`]) {
        const peticion = http().get('/api/ordenes');
        const res = await (authorization ? peticion.set('Authorization', authorization) : peticion);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ code: 'AUTH.NO_AUTENTICADO', message: 'Debes iniciar sesión para continuar.' });
      }
    });

    it.each<[string, NombreCuenta, 'post' | 'get' | 'patch', string]>([
      ['un repartidor no crea órdenes', 'repartidor1', 'post', '/api/ordenes'],
      ['el despacho no crea órdenes', 'admin', 'post', '/api/ordenes'],
      ['un cliente no cambia estados', 'clienteA', 'patch', '/api/ordenes/ORD-000001/estado'],
      ['el despacho no cambia estados', 'admin', 'patch', '/api/ordenes/ORD-000001/estado'],
      ['un cliente no lee rutas', 'clienteA', 'get', '/api/repartidores/1/ruta'],
      ['un cliente no lista repartidores', 'clienteA', 'get', '/api/repartidores'],
      ['un repartidor no lista repartidores', 'repartidor1', 'get', '/api/repartidores'],
    ])('403: %s', async (_caso, cuenta, metodo, ruta) => {
      const res = await http()[metodo](ruta).set(como(cuenta)).send({});

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ code: 'AUTH.PERMISO_DENEGADO', message: 'Tu rol no tiene permiso para realizar esta acción.' });
    });
  });

  describe('POST /api/ordenes', () => {
    it('201: registra la orden, la asigna al repartidor más cercano y responde con el sobre de escritura', async () => {
      const res = await http().post('/api/ordenes').set(como('clienteA')).send({ lat: 0, lng: 18, peso: 4.5, direccion: 'Zona 10' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        statusCode: 201,
        code: 'CREATED',
        message: 'Orden ORD-000001 registrada y asignada a Bruno Castillo.',
        data: {
          folio: 'ORD-000001',
          lat: 0,
          lng: 18,
          peso: 4.5,
          direccion: 'Zona 10',
          estado: 'ASIGNADA',
          estadoDescripcion: 'Asignada',
          repartidor: { id: 2, nombre: 'Bruno Castillo' },
          secuenciaRuta: 1,
        },
      });
      expect(res.body.data.historial.map((h: { estadoDescripcion: string }) => h.estadoDescripcion)).toEqual([
        'Pendiente de Asignación',
        'Asignada',
      ]);
      expect(Number.isNaN(Date.parse(res.body.data.historial[0].fecha))).toBe(false);
    });

    it('201: sin repartidores disponibles la orden queda en cola; no es un error', async () => {
      base.repartidores.forEach((r) => (r.estado = ESTADO_REPARTIDOR.EN_RUTA));

      const res = await http().post('/api/ordenes').set(como('clienteA')).send(zona(1));

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('CREATED');
      expect(res.body.message).toContain('Pendiente de Asignación');
      expect(res.body.data).toMatchObject({
        estado: 'PENDIENTE_ASIGNACION',
        estadoDescripcion: 'Pendiente de Asignación',
        repartidor: null,
        secuenciaRuta: null,
      });
    });

    it.each([
      ['coordenadas como texto', { lat: '14.6', lng: '-90.5', peso: 1 }, ['lat', 'lng']],
      ['latitud y longitud fuera de rango', { lat: 91, lng: -181, peso: 1 }, ['lat', 'lng']],
      ['peso en cero', { lat: 0, lng: 0, peso: 0 }, ['peso']],
      ['peso negativo', { lat: 0, lng: 0, peso: -5 }, ['peso']],
      ['peso por encima del máximo', { lat: 0, lng: 0, peso: 50.01 }, ['peso']],
      ['peso no numérico', { lat: 0, lng: 0, peso: 'pesado' }, ['peso']],
      ['cuerpo vacío', {}, ['lat', 'lng', 'peso']],
      ['dirección demasiado larga', { lat: 0, lng: 0, peso: 1, direccion: 'x'.repeat(121) }, ['direccion']],
    ])('400: rechaza %s con un mensaje por campo', async (_caso, cuerpo, campos) => {
      const res = await http().post('/api/ordenes').set(como('clienteA')).send(cuerpo);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ statusCode: 400, code: 'VALIDACION.ENTRADA_INVALIDA' });
      expect(res.body.details.map((d: { campo: string }) => d.campo)).toEqual(campos);
      expect(res.body.details.every((d: { mensaje: string }) => d.mensaje.length > 10)).toBe(true);
      expect(base.ordenes).toHaveLength(0);
    });

    it('ignora las propiedades que el contrato no define', async () => {
      const res = await http()
        .post('/api/ordenes')
        .set(como('clienteA'))
        .send({ ...zona(1), estado: 'ENTREGADA', folio: 'ORD-HACK', clienteId: 'otro' });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ folio: 'ORD-000001', estado: 'ASIGNADA' });
      expect(base.orden('ORD-000001').clienteId).toBe(CUENTAS.clienteA.id);
    });
  });

  describe('GET /api/ordenes', () => {
    beforeEach(async () => {
      await http().post('/api/ordenes').set(como('clienteA')).send(zona(1));
      await http().post('/api/ordenes').set(como('clienteB')).send(zona(19));
      await http().post('/api/ordenes').set(como('clienteA')).send(zona(2));
    });

    const folios = (res: request.Response): string[] => res.body.data.map((o: { folio: string }) => o.folio).sort();

    it('200: acepta la consulta tal como la escribe el enunciado (?estado=&page=&limit=)', async () => {
      const res = await http().get('/api/ordenes?estado=&page=&limit=').set(como('admin'));

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ total: 3, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
      expect(folios(res)).toEqual(['ORD-000001', 'ORD-000002', 'ORD-000003']);
    });

    it('200: pagina con page y limit', async () => {
      const primera = await http().get('/api/ordenes?page=1&limit=2').set(como('admin'));
      const segunda = await http().get('/api/ordenes?page=2&limit=2').set(como('admin'));
      const fuera = await http().get('/api/ordenes?page=7&limit=2').set(como('admin'));

      expect(primera.body.data).toHaveLength(2);
      expect(primera.body.meta).toEqual({ total: 3, page: 1, limit: 2, totalPages: 2, hasNextPage: true, hasPreviousPage: false });
      expect(segunda.body.data).toHaveLength(1);
      expect(segunda.body.meta).toMatchObject({ page: 2, hasNextPage: false, hasPreviousPage: true });
      expect(fuera.status).toBe(200);
      expect(fuera.body).toMatchObject({ data: [], meta: { total: 3, page: 7, totalPages: 2, hasNextPage: false } });
    });

    it('200: filtra por estado, sin distinguir mayúsculas', async () => {
      await http().patch('/api/ordenes/ORD-000002/estado').set(como('repartidor2')).send({ estado: 'ENTREGADA' });

      const entregadas = await http().get('/api/ordenes?estado=entregada').set(como('admin'));
      const asignadas = await http().get('/api/ordenes?estado=ASIGNADA').set(como('admin'));

      expect(folios(entregadas)).toEqual(['ORD-000002']);
      expect(folios(asignadas)).toEqual(['ORD-000001', 'ORD-000003']);
    });

    it('cada rol ve un alcance distinto: cliente sus órdenes, repartidor las suyas, despacho todas', async () => {
      expect(folios(await http().get('/api/ordenes').set(como('clienteA')))).toEqual(['ORD-000001', 'ORD-000003']);
      expect(folios(await http().get('/api/ordenes').set(como('clienteB')))).toEqual(['ORD-000002']);
      expect(folios(await http().get('/api/ordenes').set(como('repartidor1')))).toEqual(['ORD-000001', 'ORD-000003']);
      expect(folios(await http().get('/api/ordenes').set(como('repartidor2')))).toEqual(['ORD-000002']);
      expect(folios(await http().get('/api/ordenes').set(como('admin')))).toHaveLength(3);
    });

    it.each([
      ['estado desconocido', 'estado=CANCELADA', 'estado'],
      ['página en cero', 'page=0', 'page'],
      ['página no numérica', 'page=dos', 'page'],
      ['página decimal', 'page=1.5', 'page'],
      ['límite por encima del máximo', 'limit=101', 'limit'],
      ['límite negativo', 'limit=-1', 'limit'],
    ])('400: rechaza %s', async (_caso, query, campo) => {
      const res = await http().get(`/api/ordenes?${query}`).set(como('admin'));

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([expect.objectContaining({ campo })]);
    });
  });

  describe('GET /api/ordenes/{folio}', () => {
    beforeEach(async () => {
      await http().post('/api/ordenes').set(como('clienteA')).send(zona(1));
    });

    it('200: el dueño, su repartidor y el despacho ven la orden con su historial', async () => {
      for (const cuenta of ['clienteA', 'repartidor1', 'admin'] as const) {
        const res = await http().get('/api/ordenes/ord-000001').set(como(cuenta));

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ folio: 'ORD-000001', estado: 'ASIGNADA' });
        expect(res.body.historial).toHaveLength(2);
      }
    });

    it('403: otro cliente u otro repartidor no pueden verla', async () => {
      for (const cuenta of ['clienteB', 'repartidor2'] as const) {
        const res = await http().get('/api/ordenes/ORD-000001').set(como(cuenta));

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('AUTH.RECURSO_AJENO');
      }
    });

    it('404: folio inexistente, con mensaje amigable', async () => {
      const res = await http().get('/api/ordenes/ORD-999999').set(como('clienteA'));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        statusCode: 404,
        code: 'RUTAS.ORDEN_NO_ENCONTRADA',
        message: 'No existe una orden con el folio ORD-999999.',
      });
      expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    });

    it('404: el mensaje sale en inglés con Accept-Language: en', async () => {
      const res = await http().get('/api/ordenes/ORD-999999').set(como('admin')).set('Accept-Language', 'en-US,en;q=0.9');

      expect(res.body.message).toBe('There is no order with folio ORD-999999.');
    });
  });

  describe('PATCH /api/ordenes/{folio}/estado', () => {
    beforeEach(async () => {
      await http().post('/api/ordenes').set(como('clienteA')).send(zona(1));
      await http().post('/api/ordenes').set(como('clienteA')).send(zona(2));
    });

    it('200: EN_RUTA saca a ruta todas las órdenes del repartidor', async () => {
      const res = await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor1')).send({ estado: 'EN_RUTA' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        statusCode: 200,
        code: 'OK',
        message: 'Ruta iniciada con 2 parada(s) en camino.',
        data: { folio: 'ORD-000001', estado: 'EN_RUTA', estadoDescripcion: 'En Ruta' },
      });
      expect(base.orden('ORD-000002').estado).toBe('EN_RUTA');
      expect(base.repartidor(1).estado).toBe('EN_RUTA');
    });

    it('200: ENTREGADA marca la parada y deja el historial completo con fechas', async () => {
      await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor1')).send({ estado: 'EN_RUTA' });

      const res = await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor1')).send({ estado: 'ENTREGADA' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Orden ORD-000001 marcada como entregada.');
      expect(res.body.data).toMatchObject({ estado: 'ENTREGADA', secuenciaRuta: null, repartidor: { id: 1 } });
      expect(res.body.data.historial.map((h: { estado: string }) => h.estado)).toEqual([
        'PENDIENTE_ASIGNACION',
        'ASIGNADA',
        'EN_RUTA',
        'ENTREGADA',
      ]);
    });

    it('200: al entregar la última parada avisa que la ruta se completó', async () => {
      await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor1')).send({ estado: 'ENTREGADA' });

      const res = await http().patch('/api/ordenes/ORD-000002/estado').set(como('repartidor1')).send({ estado: 'entregada' });

      expect(res.body.message).toBe('Orden ORD-000002 marcada como entregada. Completaste tu ruta.');
      expect(base.repartidor(1).estado).toBe('DISPONIBLE');
    });

    it('403: un repartidor no puede cambiar la parada de otro', async () => {
      const res = await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor2')).send({ estado: 'ENTREGADA' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('AUTH.RECURSO_AJENO');
      expect(base.orden('ORD-000001').estado).toBe('ASIGNADA');
    });

    it('404: folio inexistente', async () => {
      const res = await http().patch('/api/ordenes/ORD-999999/estado').set(como('repartidor1')).send({ estado: 'ENTREGADA' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('RUTAS.ORDEN_NO_ENCONTRADA');
    });

    it('409: no se puede entregar dos veces ni volver a salir a ruta', async () => {
      await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor1')).send({ estado: 'ENTREGADA' });

      const otraVez = await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor1')).send({ estado: 'ENTREGADA' });
      const salirDeNuevo = await http().patch('/api/ordenes/ORD-000002/estado').set(como('repartidor1')).send({ estado: 'EN_RUTA' });

      expect(otraVez.status).toBe(409);
      expect(otraVez.body).toMatchObject({ code: 'RUTAS.TRANSICION_ESTADO_INVALIDA', message: 'La orden ORD-000001 ya está "Entregada".' });
      expect(salirDeNuevo.status).toBe(409);
      expect(salirDeNuevo.body.message).toBe('La orden ORD-000002 ya está "En Ruta".');
    });

    it.each([
      ['un estado que el repartidor no puede pedir', { estado: 'ASIGNADA' }],
      ['un estado desconocido', { estado: 'CANCELADA' }],
      ['cuerpo vacío', {}],
    ])('400: rechaza %s', async (_caso, cuerpo) => {
      const res = await http().patch('/api/ordenes/ORD-000001/estado').set(como('repartidor1')).send(cuerpo);

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([{ campo: 'estado', mensaje: 'El estado debe ser EN_RUTA o ENTREGADA.' }]);
    });
  });

  describe('GET /api/repartidores/{id}/ruta', () => {
    beforeEach(async () => {
      await http().post('/api/ordenes').set(como('clienteA')).send(zona(3, 4));
      await http()
        .post('/api/ordenes')
        .set(como('clienteA'))
        .send({ ...zona(1, 2.5), direccion: 'Parada cercana' });
    });

    it('200: paradas pendientes en el orden optimizado, con la distancia de cada tramo', async () => {
      const res = await http().get('/api/repartidores/1/ruta').set(como('repartidor1'));

      expect(res.status).toBe(200);
      expect(res.body.repartidor).toEqual({
        id: 1,
        nombre: 'Ana López',
        estado: 'DISPONIBLE',
        estadoDescripcion: 'Disponible',
        lat: 0,
        lng: 0,
        capacidadKg: 50,
        cargaKg: 6.5,
      });
      expect(res.body.paradas).toHaveLength(2);
      expect(res.body.paradas[0]).toMatchObject({
        secuencia: 1,
        folio: 'ORD-000002',
        peso: 2.5,
        direccion: 'Parada cercana',
        estado: 'ASIGNADA',
        estadoDescripcion: 'Asignada',
        // 1° de longitud en el ecuador = 111.195 km.
        distanciaDesdeAnteriorKm: 111.2,
        distanciaAcumuladaKm: 111.2,
      });
      expect(res.body.paradas[1]).toMatchObject({
        secuencia: 2,
        folio: 'ORD-000001',
        distanciaDesdeAnteriorKm: 222.39,
        distanciaAcumuladaKm: 333.59,
      });
      expect(res.body).toMatchObject({ totalParadas: 2, distanciaTotalKm: 333.59 });
    });

    it('200: el despacho puede ver la ruta de cualquier repartidor, también una vacía', async () => {
      const res = await http().get('/api/repartidores/2/ruta').set(como('admin'));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ paradas: [], totalParadas: 0, distanciaTotalKm: 0 });
    });

    it('la ruta se sirve de caché y se invalida cuando cambia', async () => {
      const primera = await http().get('/api/repartidores/1/ruta').set(como('repartidor1'));
      const segunda = await http().get('/api/repartidores/1/ruta').set(como('repartidor1'));
      expect(segunda.body.calculadaEn).toBe(primera.body.calculadaEn);
      expect(cache.entradas.has(1)).toBe(true);

      await http().patch('/api/ordenes/ORD-000002/estado').set(como('repartidor1')).send({ estado: 'ENTREGADA' });
      expect(cache.entradas.has(1)).toBe(false);

      const tercera = await http().get('/api/repartidores/1/ruta').set(como('repartidor1'));
      expect(tercera.body.paradas.map((p: { folio: string }) => p.folio)).toEqual(['ORD-000001']);
      expect(tercera.body.repartidor).toMatchObject({ estado: 'EN_RUTA', lng: 1 });
    });

    it('403: un repartidor no puede ver la ruta de otro', async () => {
      const res = await http().get('/api/repartidores/1/ruta').set(como('repartidor2'));

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('AUTH.RECURSO_AJENO');
    });

    it('404: id de repartidor inexistente, con mensaje amigable (aunque lo pida un repartidor)', async () => {
      for (const cuenta of ['repartidor1', 'admin'] as const) {
        const res = await http().get('/api/repartidores/999/ruta').set(como(cuenta));

        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          statusCode: 404,
          code: 'RUTAS.REPARTIDOR_NO_ENCONTRADO',
          message: 'No existe un repartidor con el id 999.',
        });
      }
    });

    it.each(['abc', '1.5', '-1', '0', '99999999999'])('400: id "%s" no es un entero positivo válido', async (id) => {
      const res = await http().get(`/api/repartidores/${id}/ruta`).set(como('admin'));

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([{ campo: 'id', mensaje: 'El id del repartidor debe ser un número entero positivo.' }]);
    });
  });

  describe('GET /api/repartidores', () => {
    it('200: el despacho ve a todos con su estado, carga y paradas pendientes', async () => {
      await http().post('/api/ordenes').set(como('clienteA')).send(zona(1, 7.5));

      const res = await http().get('/api/repartidores').set(como('admin'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          id: 1,
          nombre: 'Ana López',
          estado: 'DISPONIBLE',
          estadoDescripcion: 'Disponible',
          lat: 0,
          lng: 0,
          capacidadKg: 50,
          cargaKg: 7.5,
          paradasPendientes: 1,
        },
        {
          id: 2,
          nombre: 'Bruno Castillo',
          estado: 'DISPONIBLE',
          estadoDescripcion: 'Disponible',
          lat: 0,
          lng: 20,
          capacidadKg: 50,
          cargaKg: 0,
          paradasPendientes: 0,
        },
      ]);
    });
  });

  describe('errores genéricos', () => {
    it('404: una ruta HTTP que no existe también responde con la forma estándar', async () => {
      const res = await http().get('/api/no-existe').set(como('admin'));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ statusCode: 404, code: 'HTTP.RECURSO_NO_ENCONTRADO', message: 'El recurso solicitado no existe.' });
    });

    it('400: un JSON mal formado no expone detalles internos', async () => {
      const res = await http().post('/api/ordenes').set(como('clienteA')).set('Content-Type', 'application/json').send('{"lat": 14.6,');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code: 'HTTP.SOLICITUD_INVALIDA', message: 'La petición no es válida.' });
    });
  });
});
