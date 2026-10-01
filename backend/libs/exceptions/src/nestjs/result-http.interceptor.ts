import {
  type CallHandler,
  type ExecutionContext,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isErr, isResult } from '@almo/result';
import type { Request, Response } from 'express';
import { map, type Observable } from 'rxjs';
import { DomainOk } from '../lib/domain-ok';
import { extractLocaleFromRequest } from './http-locale';
import { toOkBody } from './http-response.mapper';
import { I18nResolver } from './i18n-resolver';
import { SKIP_RESULT_HTTP_INTERCEPTOR_KEY } from './skip-result-http-interceptor.decorator';

/**
 * Desenvuelve el `Result` que devuelve cada controller.
 *
 * - `ok(valor)`            → responde `valor` tal cual.
 * - `ok(DomainOk)`         → responde `{ statusCode, code, message, data }` con el mensaje traducido.
 * - `err(error)`           → relanza el error; `DomainExceptionFilter` le da la forma estándar.
 * - cualquier otra cosa    → 500 `RESULT_PATTERN_REQUIRED`: un endpoint que no devuelve
 *                            `Result` es un error de programación y debe notarse de inmediato.
 */
@Injectable()
export class ResultHttpInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nResolver,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_RESULT_HTTP_INTERCEPTOR_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    return next.handle().pipe(map((value: unknown) => this.unwrap(value, context)));
  }

  private unwrap(value: unknown, context: ExecutionContext): unknown {
    if (!isResult(value)) {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'RESULT_PATTERN_REQUIRED',
        message: 'El endpoint debe devolver un Result.',
      });
    }

    if (isErr(value)) throw value.error;

    const payload = value.value;
    if (!(payload instanceof DomainOk)) return payload;

    const http = context.switchToHttp();
    http.getResponse<Response>().status(payload.httpStatus);
    return toOkBody(payload, this.i18n, extractLocaleFromRequest(http.getRequest<Request>()));
  }
}
