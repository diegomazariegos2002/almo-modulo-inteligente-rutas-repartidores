import { ErrorAplicacion } from './error-aplicacion.entity';

describe('ErrorAplicacion', () => {
  it('es un Error con el mensaje para el usuario, su código y sus detalles', () => {
    const detalles = [{ campo: 'peso', mensaje: 'El peso debe ser mayor que 0.' }];

    const error = new ErrorAplicacion('Datos no válidos.', 'VALIDACION.ENTRADA_INVALIDA', detalles);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Datos no válidos.');
    expect(error.codigo).toBe('VALIDACION.ENTRADA_INVALIDA');
    expect(error.detalles).toEqual(detalles);
  });

  it('no tiene detalles si no se indican', () => {
    expect(new ErrorAplicacion('Sin conexión.', 'SIN_CONEXION').detalles).toEqual([]);
  });

  it('desde() devuelve el mismo ErrorAplicacion que recibe', () => {
    const original = new ErrorAplicacion('No encontramos la orden.', 'RUTAS.ORDEN_NO_ENCONTRADA');

    expect(ErrorAplicacion.desde(original)).toBe(original);
  });

  it('desde() convierte cualquier otro valor en un error genérico, sin detalles técnicos', () => {
    const error = ErrorAplicacion.desde(new TypeError('Cannot read properties of undefined'));

    expect(error.codigo).toBe('DESCONOCIDO');
    expect(error.message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.');
  });
});
