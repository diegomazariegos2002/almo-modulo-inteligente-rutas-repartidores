import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError, type ErrorDetail } from '../lib/domain.error';
import { extractLocaleFromRequest } from './http-locale';
import { buildErrorBody, type ErrorResponseBody, toErrorBody } from './http-response.mapper';
import { I18nResolver } from './i18n-resolver';

interface ErrorGenerico {
  code: string;
  messageKey: string;
  fallback: string;
}

/** Errores HTTP que no nacen del dominio (ruta inexistente, JSON mal formado, etc.). */
const ERRORES_HTTP: Record<number, ErrorGenerico> = {
  [HttpStatus.BAD_REQUEST]: {
    code: 'HTTP.SOLICITUD_INVALIDA',
    messageKey: 'errors.http.solicitud_invalida',
    fallback: 'La petición no es válida.',
  },
  [HttpStatus.NOT_FOUND]: {
    code: 'HTTP.RECURSO_NO_ENCONTRADO',
    messageKey: 'errors.http.recurso_no_encontrado',
    fallback: 'El recurso solicitado no existe.',
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    code: 'HTTP.CUERPO_DEMASIADO_GRANDE',
    messageKey: 'errors.http.cuerpo_demasiado_grande',
    fallback: 'El cuerpo de la petición es demasiado grande.',
  },
};

const ERROR_INTERNO: ErrorGenerico = {
  code: 'INTERNAL_SERVER_ERROR',
  messageKey: 'errors.http.error_interno',
  fallback: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
};

/**
 * Da a TODA respuesta de error la misma forma: `{ statusCode, code, message, timestamp }`.
 *
 * Los errores de dominio ya traen su código y su estado HTTP. Un error no
 * controlado se registra completo en el log, pero al cliente solo le llega un
 * mensaje genérico: nunca una traza ni un detalle interno.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  constructor(private readonly i18n: I18nResolver) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') throw exception;

    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const body = this.toBody(exception, extractLocaleFromRequest(request));

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // La causa técnica (metadata) solo va al log; el cliente recibe el mensaje genérico.
      const causa = exception instanceof DomainError ? ` ${JSON.stringify(exception.metadata)}` : '';
      this.logger.error(
        `${request.method} ${request.url} → ${body.statusCode} ${body.code}${causa}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    http.getResponse<Response>().status(body.statusCode).json(body);
  }

  private toBody(exception: unknown, locale: string): ErrorResponseBody {
    if (exception instanceof DomainError) return toErrorBody(exception, this.i18n, locale);
    if (exception instanceof HttpException) return this.fromHttpException(exception, locale);
    return this.generico(HttpStatus.INTERNAL_SERVER_ERROR, ERROR_INTERNO, locale);
  }

  private fromHttpException(exception: HttpException, locale: string): ErrorResponseBody {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // Excepción que ya trae la forma estándar (p. ej. RESULT_PATTERN_REQUIRED).
    if (typeof response === 'object' && response !== null) {
      const { code, message, details } = response as { code?: unknown; message?: unknown; details?: unknown };
      if (typeof code === 'string' && typeof message === 'string') {
        return buildErrorBody(status, code, message, Array.isArray(details) ? (details as ErrorDetail[]) : undefined);
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) return this.generico(status, ERROR_INTERNO, locale);

    const conocido = ERRORES_HTTP[status];
    if (conocido) return this.generico(status, conocido, locale);

    return buildErrorBody(status, `HTTP.${status}`, exception.message);
  }

  private generico(status: number, error: ErrorGenerico, locale: string): ErrorResponseBody {
    return buildErrorBody(status, error.code, this.i18n.resolve(error.messageKey, {}, locale) ?? error.fallback);
  }
}
