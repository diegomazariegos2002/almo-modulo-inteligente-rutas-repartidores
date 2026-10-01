import axios from 'axios';
import { CORREO, crearBitacora, iniciarSesion, type Sesion } from '../support/api';
import { cerrarConexiones, reiniciarDatos } from '../support/base-datos';

/**
 * Seguridad (JWT, permisos por rol, pertenencia del recurso) y errores de
 * negocio, contra el servicio real. La pertenencia se prueba con DOS sesiones
 * de repartidor: con un solo usuario no se demuestra nada.
 */
describe('Seguridad y errores', () => {
  const { step } = crearBitacora('SEGURIDAD');
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

  afterAll(cerrarConexiones);

  describe('autenticación', () => {
    it('401 sin token y con un token inválido', async () => {
      step('Petición sin token');
      const sinToken = await axios.get('/api/ordenes');
      expect(sinToken.status).toBe(401);
      expect(sinToken.data).toMatchObject({ code: 'AUTH.NO_AUTENTICADO', message: 'Debes iniciar sesión para continuar.' });

      step('Petición con un token que no firmó el servicio');
      const falso = await axios.get('/api/ordenes', { headers: { Authorization: 'Bearer aaa.bbb.ccc' } });
      expect(falso.status).toBe(401);
      expect(falso.data.code).toBe('AUTH.NO_AUTENTICADO');
    });

    it('401 con credenciales incorrectas en el login', async () => {
      const res = await axios.post('/api/auth/login', { correo: CORREO.cliente, password: 'no-es-la-clave' });

      expect(res.status).toBe(401);
      expect(res.data).toMatchObject({ code: 'AUTH.CREDENCIALES_INVALIDAS', message: 'Correo o contraseña incorrectos.' });
    });
  });

  describe('permisos distintos por rol', () => {
    it('el cliente crea órdenes; el repartidor y el despacho no', async () => {
      const cuerpo = { lat: 14.6, lng: -90.5, peso: 1 };

      expect((await axios.post('/api/ordenes', cuerpo, ana)).status).toBe(403);
      expect((await axios.post('/api/ordenes', cuerpo, admin)).status).toBe(403);
      expect((await axios.post('/api/ordenes', cuerpo, cliente)).status).toBe(201);
    });

    it('el repartidor cambia estados; el cliente y el despacho no', async () => {
      const cuerpo = { estado: 'ENTREGADA' };

      const comoCliente = await axios.patch('/api/ordenes/ORD-000003/estado', cuerpo, cliente);
      const comoAdmin = await axios.patch('/api/ordenes/ORD-000003/estado', cuerpo, admin);

      expect(comoCliente.status).toBe(403);
      expect(comoCliente.data.code).toBe('AUTH.PERMISO_DENEGADO');
      expect(comoAdmin.status).toBe(403);
    });

    it('el repartidor y el despacho leen rutas; el cliente no', async () => {
      expect((await axios.get('/api/repartidores/1/ruta', cliente)).status).toBe(403);
      expect((await axios.get('/api/repartidores/1/ruta', ana)).status).toBe(200);
      expect((await axios.get('/api/repartidores/1/ruta', admin)).status).toBe(200);
    });

    it('solo el despacho lista repartidores', async () => {
      expect((await axios.get('/api/repartidores', cliente)).status).toBe(403);
      expect((await axios.get('/api/repartidores', ana)).status).toBe(403);
      expect((await axios.get('/api/repartidores', admin)).status).toBe(200);
    });
  });

  describe('pertenencia del recurso (dos repartidores)', () => {
    it('un repartidor no puede leer la ruta de otro', async () => {
      const ajena = await axios.get('/api/repartidores/1/ruta', bruno);
      const propia = await axios.get('/api/repartidores/2/ruta', bruno);

      expect(ajena.status).toBe(403);
      expect(ajena.data).toMatchObject({ code: 'AUTH.RECURSO_AJENO', message: 'No tienes acceso a este recurso.' });
      expect(propia.status).toBe(200);
    });

    it('un repartidor no puede cambiar el estado de la parada de otro, y la parada no cambia', async () => {
      step('Bruno intenta entregar ORD-000003, que es de Ana');
      const intento = await axios.patch('/api/ordenes/ORD-000003/estado', { estado: 'ENTREGADA' }, bruno);
      expect(intento.status).toBe(403);
      expect(intento.data.code).toBe('AUTH.RECURSO_AJENO');

      const orden = await axios.get('/api/ordenes/ORD-000003', ana);
      expect(orden.data.estado).toBe('ASIGNADA');
    });

    it('cada repartidor solo ve en el listado las órdenes que tiene asignadas', async () => {
      const deAna = await axios.get('/api/ordenes', ana);
      const deBruno = await axios.get('/api/ordenes', bruno);

      expect(deAna.data.data.every((o: { repartidor: { id: number } }) => o.repartidor.id === 1)).toBe(true);
      expect(deBruno.data.data.every((o: { repartidor: { id: number } }) => o.repartidor.id === 2)).toBe(true);
      expect(deAna.data.meta.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('errores de negocio con mensaje amigable', () => {
    it('404 si el folio no existe', async () => {
      const detalle = await axios.get('/api/ordenes/ORD-999999', cliente);
      const cambio = await axios.patch('/api/ordenes/ORD-999999/estado', { estado: 'ENTREGADA' }, ana);

      for (const res of [detalle, cambio]) {
        expect(res.status).toBe(404);
        expect(res.data).toMatchObject({
          statusCode: 404,
          code: 'RUTAS.ORDEN_NO_ENCONTRADA',
          message: 'No existe una orden con el folio ORD-999999.',
        });
      }
    });

    it('404 si el id de repartidor no existe, aunque lo pida un repartidor', async () => {
      for (const sesion of [ana, admin]) {
        const res = await axios.get('/api/repartidores/999/ruta', sesion);

        expect(res.status).toBe(404);
        expect(res.data).toMatchObject({
          statusCode: 404,
          code: 'RUTAS.REPARTIDOR_NO_ENCONTRADO',
          message: 'No existe un repartidor con el id 999.',
        });
      }
    });

    it('400 con un detalle por campo si las coordenadas o el peso no son válidos', async () => {
      const res = await axios.post('/api/ordenes', { lat: 'catorce', lng: -190, peso: 0 }, cliente);

      expect(res.status).toBe(400);
      expect(res.data.code).toBe('VALIDACION.ENTRADA_INVALIDA');
      expect(res.data.details).toEqual([
        { campo: 'lat', mensaje: 'La latitud debe ser un número entre -90 y 90.' },
        { campo: 'lng', mensaje: 'La longitud debe ser un número entre -180 y 180.' },
        { campo: 'peso', mensaje: 'El peso debe ser un número mayor que 0 y de hasta 50 kg.' },
      ]);
    });

    it('409 si el cambio de estado no es válido', async () => {
      step('Ana entrega ORD-000003 y luego intenta entregarla otra vez');
      const primera = await axios.patch('/api/ordenes/ORD-000003/estado', { estado: 'ENTREGADA' }, ana);
      expect(primera.status).toBe(200);

      const repetida = await axios.patch('/api/ordenes/ORD-000003/estado', { estado: 'ENTREGADA' }, ana);
      expect(repetida.status).toBe(409);
      expect(repetida.data).toMatchObject({
        code: 'RUTAS.TRANSICION_ESTADO_INVALIDA',
        message: 'La orden ORD-000003 ya está "Entregada".',
      });
    });

    it('los mensajes salen en inglés con Accept-Language: en', async () => {
      const res = await axios.get('/api/repartidores/999/ruta', { headers: { ...admin.headers, 'Accept-Language': 'en' } });

      expect(res.data.message).toBe('There is no courier with id 999.');
    });
  });

  it('GET /api/health es público y reporta la base y el caché', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', checks: { database: 'up', cache: 'up' } });
  });
});
