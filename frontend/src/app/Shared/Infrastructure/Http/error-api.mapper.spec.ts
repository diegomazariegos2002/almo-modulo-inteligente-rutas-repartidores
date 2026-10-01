import { HttpErrorResponse } from '@angular/common/http';
import { mapearErrorHttp } from './error-api.mapper';

function respuesta(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error, url: '/api/ordenes' });
}

function errorApi(statusCode: number, code: string, message: string, details?: unknown[]) {
  return { statusCode, code, message, timestamp: '2026-09-30T18:00:00.000Z', details };
}

describe('mapearErrorHttp', () => {
  it('usa el mensaje propio de la interfaz para un código conocido del contrato', () => {
    const error = mapearErrorHttp(
      respuesta(
        401,
        errorApi(
          401,
          'AUTH.CREDENCIALES_INVALIDAS',
          'Credenciales inválidas (mensaje del servidor)',
        ),
      ),
    );

    expect(error.codigo).toBe('AUTH.CREDENCIALES_INVALIDAS');
    expect(error.message).toBe('El correo o la contraseña no son correctos.');
  });

  it('conserva los errores por campo de una validación fallida', () => {
    const details = [
      { campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' },
    ];

    const error = mapearErrorHttp(
      respuesta(
        400,
        errorApi(400, 'VALIDACION.ENTRADA_INVALIDA', 'Los datos enviados no son válidos.', details),
      ),
    );

    expect(error.message).toBe('Algunos datos no son válidos. Revisa los campos marcados.');
    expect(error.detalles).toEqual(details);
  });

  it('muestra el mensaje del servidor cuando un 4xx trae un código que la interfaz no conoce', () => {
    const error = mapearErrorHttp(
      respuesta(422, errorApi(422, 'RUTAS.CODIGO_NUEVO', 'La orden no admite más cambios.')),
    );

    expect(error.codigo).toBe('RUTAS.CODIGO_NUEVO');
    expect(error.message).toBe('La orden no admite más cambios.');
    expect(error.detalles).toEqual([]);
  });

  it('nunca muestra el mensaje de un fallo del servidor (5xx)', () => {
    const error = mapearErrorHttp(
      respuesta(
        500,
        errorApi(500, 'INTERNAL_SERVER_ERROR', 'duplicate key value violates unique constraint'),
      ),
    );

    expect(error.codigo).toBe('DESCONOCIDO');
    expect(error.message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.');
  });

  it('trata como error inesperado un cuerpo que no sigue el contrato', () => {
    const error = mapearErrorHttp(respuesta(404, '<html>Cannot GET /api/otra-cosa</html>'));

    expect(error.codigo).toBe('DESCONOCIDO');
    expect(error.message).not.toContain('html');
  });

  for (const status of [0, 502, 503, 504]) {
    it(`informa de un problema de conexión cuando el backend no responde (HTTP ${status})`, () => {
      const error = mapearErrorHttp(respuesta(status, null));

      expect(error.codigo).toBe('SIN_CONEXION');
      expect(error.message).toBe(
        'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      );
    });
  }
});
