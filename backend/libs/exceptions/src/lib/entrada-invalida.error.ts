import { ValidationError } from './categories';
import type { ErrorDetail } from './domain.error';

/** El cuerpo, la query o un parámetro de ruta no cumplen el contrato del endpoint. */
export class EntradaInvalidaError extends ValidationError {
  readonly code = 'VALIDACION.ENTRADA_INVALIDA' as const;

  constructor(details: ErrorDetail[]) {
    super({
      messageKey: 'errors.validacion.entrada_invalida',
      message: 'Los datos enviados no son válidos.',
      details,
    });
  }
}
