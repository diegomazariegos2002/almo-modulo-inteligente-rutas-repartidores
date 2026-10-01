import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error.response.dto';

/**
 * Documenta la respuesta de una escritura: el sobre `{ statusCode, code, message, data }`
 * con `data` del tipo indicado.
 */
export function ApiRespuestaConMensaje(status: 200 | 201, dto: Type<unknown>, description: string): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(dto),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        required: ['statusCode', 'code', 'message', 'data'],
        properties: {
          statusCode: { type: 'number', example: status },
          code: { type: 'string', example: status === 201 ? 'CREATED' : 'OK' },
          message: { type: 'string', description: 'Mensaje traducido para mostrar al usuario.' },
          data: { $ref: getSchemaPath(dto) },
        },
      },
    }),
  );
}

const DESCRIPCION_POR_ESTADO: Record<number, string> = {
  400: '`VALIDACION.ENTRADA_INVALIDA` — datos faltantes, no numéricos o fuera de rango (con `details` por campo).',
  401: '`AUTH.NO_AUTENTICADO` — falta el token, es inválido o expiró.',
  403: '`AUTH.PERMISO_DENEGADO` — el rol no tiene el permiso. `AUTH.RECURSO_AJENO` — el recurso es de otro usuario.',
  404: 'El recurso no existe.',
  409: '`RUTAS.TRANSICION_ESTADO_INVALIDA` — el cambio no es válido desde el estado actual.',
};

/** Documenta los errores posibles de un endpoint, todos con la misma forma. */
export function ApiErrores(...errores: Array<number | { status: number; description: string }>): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ...errores.map((error) => {
      const status = typeof error === 'number' ? error : error.status;
      const description = typeof error === 'number' ? (DESCRIPCION_POR_ESTADO[error] ?? 'Error') : error.description;
      return ApiResponse({ status, description, type: ErrorResponseDto });
    }),
  );
}
