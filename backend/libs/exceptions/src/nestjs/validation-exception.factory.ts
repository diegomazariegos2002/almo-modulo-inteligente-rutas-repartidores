import type { ValidationError as ClassValidatorError } from '@nestjs/common';
import type { ErrorDetail } from '../lib/domain.error';
import { EntradaInvalidaError } from '../lib/entrada-invalida.error';

/**
 * `exceptionFactory` del `ValidationPipe` global.
 *
 * Convierte los errores de class-validator en un `EntradaInvalidaError` con un
 * detalle por campo, para que el cliente pueda marcar cada input con su mensaje.
 */
export function validationExceptionFactory(errors: ClassValidatorError[]): EntradaInvalidaError {
  return new EntradaInvalidaError(errors.flatMap((error) => aDetalles(error)));
}

function aDetalles(error: ClassValidatorError, prefijo = ''): ErrorDetail[] {
  const campo = prefijo ? `${prefijo}.${error.property}` : error.property;

  // Un mensaje por campo: el primero basta para corregir el dato.
  const mensaje = Object.values(error.constraints ?? {})[0];
  const propios: ErrorDetail[] = mensaje ? [{ campo, mensaje }] : [];
  const anidados = (error.children ?? []).flatMap((hijo) => aDetalles(hijo, campo));

  return [...propios, ...anidados];
}
