import { type ArgumentsHost, BadRequestException, type CallHandler, type ExecutionContext, NotFoundException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { err, ok } from '@almo/result';
import { firstValueFrom, of } from 'rxjs';
import { NotFoundError } from '../lib/categories';
import { CreatedResponse } from '../lib/domain-ok';
import { DomainExceptionFilter } from './domain-exception.filter';
import { extractLocaleFromRequest } from './http-locale';
import { SimpleI18nResolver } from './i18n-resolver';
import { ResultHttpInterceptor } from './result-http.interceptor';
import { validationExceptionFactory } from './validation-exception.factory';

class OrdenNoEncontrada extends NotFoundError {
  readonly code = 'TEST.ORDEN_NO_ENCONTRADA' as const;

  constructor(folio: string) {
    super({ messageKey: 'errors.test.orden_no_encontrada', messageParams: { folio }, message: `Orden ${folio} no encontrada` });
  }
}

const i18n = new SimpleI18nResolver({
  es: {
    errors: {
      test: { orden_no_encontrada: 'No existe la orden {{folio}}.' },
      http: { recurso_no_encontrado: 'El recurso solicitado no existe.' },
    },
    success: { test: { creada: 'Orden {{folio}} creada.' } },
  },
  en: { errors: { test: { orden_no_encontrada: 'Order {{folio}} does not exist.' } } },
});

describe('SimpleI18nResolver', () => {
  it('resuelve e interpola en el idioma pedido', () => {
    expect(i18n.resolve('errors.test.orden_no_encontrada', { folio: 'ORD-1' }, 'en')).toBe('Order ORD-1 does not exist.');
  });

  it('cae al idioma por defecto si falta la traducción o el idioma', () => {
    expect(i18n.resolve('success.test.creada', { folio: 'ORD-1' }, 'en')).toBe('Orden ORD-1 creada.');
    expect(i18n.resolve('success.test.creada', { folio: 'ORD-1' }, 'fr')).toBe('Orden ORD-1 creada.');
  });

  it('devuelve undefined si la clave no existe o no es un texto', () => {
    expect(i18n.resolve('errors.test.inexistente', {}, 'es')).toBeUndefined();
    expect(i18n.resolve('errors.test', {}, 'es')).toBeUndefined();
    expect(i18n.resolve('errors.test.orden_no_encontrada.mas', {}, 'es')).toBeUndefined();
  });
});

describe('extractLocaleFromRequest', () => {
  it.each([
    ['en-US,en;q=0.9', 'en'],
    ['es', 'es'],
    ['EN', 'en'],
    [undefined, 'es'],
    ['*', 'es'],
    [['en', 'es'], 'en'],
  ])('Accept-Language %p → %s', (header, esperado) => {
    expect(extractLocaleFromRequest({ headers: { 'accept-language': header } })).toBe(esperado);
  });
});

describe('ResultHttpInterceptor', () => {
  const status = jest.fn();
  let skip: boolean | undefined;
  const reflector = { getAllAndOverride: () => skip } as unknown as Reflector;
  const interceptor = new ResultHttpInterceptor(reflector, i18n);

  const contexto = (tipo = 'http', idioma?: string): ExecutionContext =>
    ({
      getType: () => tipo,
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'accept-language': idioma } }),
        getResponse: () => ({ status }),
      }),
    }) as unknown as ExecutionContext;

  const responde = (valor: unknown): CallHandler => ({ handle: () => of(valor) });

  beforeEach(() => {
    skip = undefined;
    status.mockClear();
  });

  it('devuelve el valor de un ok tal cual', async () => {
    await expect(firstValueFrom(interceptor.intercept(contexto(), responde(ok({ folio: 'ORD-1' }))))).resolves.toEqual({ folio: 'ORD-1' });
    expect(status).not.toHaveBeenCalled();
  });

  it('convierte un DomainOk en el sobre con mensaje traducido y fija el estado HTTP', async () => {
    const respuesta = new CreatedResponse({
      messageKey: 'success.test.creada',
      messageParams: { folio: 'ORD-1' },
      data: { folio: 'ORD-1' },
    });

    const body = await firstValueFrom(interceptor.intercept(contexto(), responde(ok(respuesta))));

    expect(body).toEqual({ statusCode: 201, code: 'CREATED', message: 'Orden ORD-1 creada.', data: { folio: 'ORD-1' } });
    expect(status).toHaveBeenCalledWith(201);
  });

  it('relanza el error de un err para que lo formatee el filtro', async () => {
    const error = new OrdenNoEncontrada('ORD-9');

    await expect(firstValueFrom(interceptor.intercept(contexto(), responde(err(error))))).rejects.toBe(error);
  });

  it('rechaza con 500 RESULT_PATTERN_REQUIRED una respuesta que no es Result', async () => {
    await expect(firstValueFrom(interceptor.intercept(contexto(), responde({ folio: 'ORD-1' })))).rejects.toMatchObject({
      response: { code: 'RESULT_PATTERN_REQUIRED' },
      status: 500,
    });
  });

  it('no interviene si el endpoint está marcado con @SkipResultHttpInterceptor', async () => {
    skip = true;

    await expect(firstValueFrom(interceptor.intercept(contexto(), responde({ status: 'ok' })))).resolves.toEqual({ status: 'ok' });
  });

  it('no interviene fuera de HTTP', async () => {
    await expect(firstValueFrom(interceptor.intercept(contexto('rpc'), responde('crudo')))).resolves.toBe('crudo');
  });
});

describe('DomainExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const filtro = new DomainExceptionFilter(i18n);

  const host = (idioma?: string, tipo = 'http'): ArgumentsHost =>
    ({
      getType: () => tipo,
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/api/x', headers: { 'accept-language': idioma } }),
        getResponse: () => ({ status }),
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    json.mockClear();
    status.mockClear();
    jest.spyOn(filtro['logger'], 'error').mockImplementation(() => undefined);
  });

  it('formatea un error de dominio con su código, estado y mensaje traducido', () => {
    filtro.catch(new OrdenNoEncontrada('ORD-9'), host('en'));

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: 'TEST.ORDEN_NO_ENCONTRADA', message: 'Order ORD-9 does not exist.' }),
    );
    expect(json.mock.calls[0][0].timestamp).toEqual(expect.any(String));
  });

  it('incluye details en un error de validación', () => {
    const error = validationExceptionFactory([
      { property: 'peso', constraints: { max: 'El peso no puede superar 50 kg.' } },
      { property: 'destino', children: [{ property: 'lat', constraints: { isNumber: 'La latitud debe ser numérica.' } }] },
    ]);

    filtro.catch(error, host());

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDACION.ENTRADA_INVALIDA',
        details: [
          { campo: 'peso', mensaje: 'El peso no puede superar 50 kg.' },
          { campo: 'destino.lat', mensaje: 'La latitud debe ser numérica.' },
        ],
      }),
    );
  });

  it('traduce una HttpException conocida a un mensaje amigable', () => {
    filtro.catch(new NotFoundException('Cannot GET /api/x'), host());

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: 'HTTP.RECURSO_NO_ENCONTRADO', message: 'El recurso solicitado no existe.' }),
    );
  });

  it('usa el texto de respaldo cuando no hay traducción', () => {
    filtro.catch(new BadRequestException('Unexpected token'), host());

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'HTTP.SOLICITUD_INVALIDA', message: 'La petición no es válida.' }),
    );
  });

  it('respeta una HttpException que ya trae la forma estándar', () => {
    filtro.catch(new BadRequestException({ code: 'X.PROPIO', message: 'Mensaje propio' }), host());

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, code: 'X.PROPIO', message: 'Mensaje propio' }));
  });

  it('oculta el detalle de un error no controlado y lo registra', () => {
    filtro.catch(new Error('connection refused 10.0.0.5'), host());

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.message).not.toContain('10.0.0.5');
    expect(filtro['logger'].error).toHaveBeenCalled();
  });

  it('relanza la excepción fuera de HTTP', () => {
    const error = new Error('rpc');

    expect(() => filtro.catch(error, host(undefined, 'rpc'))).toThrow(error);
  });
});
