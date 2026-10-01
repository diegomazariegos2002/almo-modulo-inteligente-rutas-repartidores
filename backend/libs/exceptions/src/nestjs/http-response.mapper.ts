import type { DomainError, ErrorDetail } from '../lib/domain.error';
import type { DomainOk } from '../lib/domain-ok';
import type { I18nResolver } from './i18n-resolver';

/** Forma única de toda respuesta de error de la API. */
export interface ErrorResponseBody {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  details?: ErrorDetail[];
}

/** Sobre de las respuestas de escritura que llevan un mensaje para el usuario. */
export interface OkResponseBody<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T;
}

export function buildErrorBody(statusCode: number, code: string, message: string, details?: ErrorDetail[]): ErrorResponseBody {
  return {
    statusCode,
    code,
    message,
    timestamp: new Date().toISOString(),
    ...(details && details.length > 0 ? { details } : {}),
  };
}

export function toErrorBody(error: DomainError, i18n: I18nResolver, locale: string): ErrorResponseBody {
  const message = i18n.resolve(error.messageKey, error.messageParams, locale) ?? error.message;
  return buildErrorBody(error.httpStatus, error.code, message, error.details);
}

export function toOkBody<T>(respuesta: DomainOk<T>, i18n: I18nResolver, locale: string): OkResponseBody<T> {
  return {
    statusCode: respuesta.httpStatus,
    code: respuesta.code,
    message: i18n.resolve(respuesta.messageKey, respuesta.messageParams, locale) ?? respuesta.messageKey,
    data: respuesta.data,
  };
}
