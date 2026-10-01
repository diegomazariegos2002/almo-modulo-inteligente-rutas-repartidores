import { HttpErrorResponse } from '@angular/common/http';
import { ErrorAplicacion } from '../../Domain/error-aplicacion.entity';
import { ErrorApi } from './respuesta-api.models';

/**
 * Texto que ve el usuario para cada `code` del contrato. El código es estable; el
 * texto es responsabilidad de la interfaz y por eso vive aquí y no en el servidor.
 */
const MENSAJES_POR_CODIGO: Record<string, string> = {
  'VALIDACION.ENTRADA_INVALIDA': 'Algunos datos no son válidos. Revisa los campos marcados.',
  'AUTH.CREDENCIALES_INVALIDAS': 'El correo o la contraseña no son correctos.',
  'AUTH.NO_AUTENTICADO': 'Tu sesión expiró. Inicia sesión de nuevo.',
  'AUTH.PERMISO_DENEGADO': 'Tu usuario no tiene permiso para realizar esta acción.',
  'AUTH.RECURSO_AJENO': 'Este recurso pertenece a otro usuario.',
  'RUTAS.ORDEN_NO_ENCONTRADA': 'No encontramos la orden solicitada.',
  'RUTAS.REPARTIDOR_NO_ENCONTRADO': 'No encontramos al repartidor solicitado.',
  'RUTAS.TRANSICION_ESTADO_INVALIDA':
    'La orden ya cambió de estado. Actualiza la pantalla e inténtalo de nuevo.',
};

/** Estados con los que responde un proxy (nginx o `ng serve`) cuando el backend no contesta. */
const ESTADOS_SIN_SERVICIO = [0, 502, 503, 504];

function esErrorApi(cuerpo: unknown): cuerpo is ErrorApi {
  return (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    typeof (cuerpo as ErrorApi).code === 'string' &&
    typeof (cuerpo as ErrorApi).message === 'string'
  );
}

/**
 * Convierte una respuesta HTTP fallida en un `ErrorAplicacion` con un mensaje en
 * español apto para la pantalla. Nunca deja pasar códigos crudos ni trazas.
 */
export function mapearErrorHttp(respuesta: HttpErrorResponse): ErrorAplicacion {
  const { status, error: cuerpo } = respuesta;

  if (ESTADOS_SIN_SERVICIO.includes(status)) {
    return new ErrorAplicacion(
      'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      'SIN_CONEXION',
    );
  }

  // Un fallo del servidor, o un cuerpo que no sigue el contrato, nunca se muestra
  // tal cual: podría traer detalles internos.
  if (status >= 500 || !esErrorApi(cuerpo)) {
    return ErrorAplicacion.inesperado();
  }

  // Si la interfaz aún no conoce el código, se usa el mensaje del servidor, que el
  // contrato entrega en español.
  return new ErrorAplicacion(
    MENSAJES_POR_CODIGO[cuerpo.code] ?? cuerpo.message,
    cuerpo.code,
    cuerpo.details ?? [],
  );
}
