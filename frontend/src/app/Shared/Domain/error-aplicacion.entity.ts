import { DetalleValidacion } from './api.models';

/**
 * Error listo para mostrarse al usuario. Es el único tipo de error que ven los casos
 * de uso y los componentes: el interceptor de errores traduce a esta clase todo lo
 * que falla en HTTP.
 */
export class ErrorAplicacion extends Error {
  constructor(
    mensaje: string,
    /** Código estable del contrato (`RUTAS.ORDEN_NO_ENCONTRADA`, ...) o uno propio del cliente. */
    readonly codigo: string,
    /** Errores por campo; solo llegan en los fallos de validación. */
    readonly detalles: readonly DetalleValidacion[] = [],
  ) {
    super(mensaje);
    this.name = 'ErrorAplicacion';
  }

  /** Fallo que no se pudo clasificar: se informa sin exponer detalles técnicos. */
  static inesperado(): ErrorAplicacion {
    return new ErrorAplicacion(
      'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.',
      'DESCONOCIDO',
    );
  }

  /** Normaliza cualquier valor recibido en el `error` de un observable. */
  static desde(error: unknown): ErrorAplicacion {
    return error instanceof ErrorAplicacion ? error : ErrorAplicacion.inesperado();
  }
}
