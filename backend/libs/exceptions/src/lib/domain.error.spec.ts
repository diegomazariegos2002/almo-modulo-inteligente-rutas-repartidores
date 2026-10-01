import { ConflictError, NotFoundError, PersistenceError, ValidationError } from './categories';
import { DomainError } from './domain.error';
import { CreatedResponse, OkResponse } from './domain-ok';
import { EntradaInvalidaError } from './entrada-invalida.error';
import { interpolate } from './i18n.utils';

class PedidoNoEncontrado extends NotFoundError {
  readonly code = 'TEST.PEDIDO_NO_ENCONTRADO' as const;

  constructor(folio: string) {
    super({
      messageKey: 'errors.test.pedido_no_encontrado',
      messageParams: { folio },
      message: `Pedido ${folio} no encontrado`,
    });
  }
}

class EstadoInvalido extends ConflictError {
  readonly code = 'TEST.ESTADO_INVALIDO' as const;

  constructor() {
    super({ messageKey: 'errors.test.estado_invalido' });
  }
}

class FalloDeBase extends PersistenceError {
  readonly code = 'TEST.PERSISTENCE_ERROR' as const;

  constructor(detalle: string) {
    super({ messageKey: 'errors.test.persistence', metadata: { detalle } });
  }
}

describe('DomainError', () => {
  it('expone código, estado HTTP, clave y parámetros del mensaje', () => {
    const error = new PedidoNoEncontrado('ORD-000009');

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('TEST.PEDIDO_NO_ENCONTRADO');
    expect(error.httpStatus).toBe(404);
    expect(error.messageKey).toBe('errors.test.pedido_no_encontrado');
    expect(error.messageParams).toEqual({ folio: 'ORD-000009' });
    expect(error.message).toBe('Pedido ORD-000009 no encontrado');
    expect(error.name).toBe('PedidoNoEncontrado');
  });

  it('usa la clave como mensaje de respaldo y deja vacíos los opcionales', () => {
    const error = new EstadoInvalido();

    expect(error.httpStatus).toBe(409);
    expect(error.message).toBe('errors.test.estado_invalido');
    expect(error.messageParams).toEqual({});
    expect(error.metadata).toEqual({});
    expect(error.details).toBeUndefined();
  });

  it('guarda el contexto técnico en metadata', () => {
    const error = new FalloDeBase('timeout');

    expect(error.httpStatus).toBe(500);
    expect(error.metadata).toEqual({ detalle: 'timeout' });
  });

  it('EntradaInvalidaError es un 400 con detalle por campo', () => {
    const error = new EntradaInvalidaError([{ campo: 'peso', mensaje: 'El peso debe ser mayor que 0.' }]);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.httpStatus).toBe(400);
    expect(error.code).toBe('VALIDACION.ENTRADA_INVALIDA');
    expect(error.details).toEqual([{ campo: 'peso', mensaje: 'El peso debe ser mayor que 0.' }]);
  });
});

describe('DomainOk', () => {
  it('OkResponse responde 200 / OK', () => {
    const respuesta = new OkResponse({ messageKey: 'success.test.actualizado', data: { id: 1 } });

    expect(respuesta.httpStatus).toBe(200);
    expect(respuesta.code).toBe('OK');
    expect(respuesta.data).toEqual({ id: 1 });
    expect(respuesta.messageParams).toEqual({});
  });

  it('CreatedResponse responde 201 / CREATED', () => {
    const respuesta = new CreatedResponse({ messageKey: 'success.test.creado', messageParams: { folio: 'X' }, data: null });

    expect(respuesta.httpStatus).toBe(201);
    expect(respuesta.code).toBe('CREATED');
    expect(respuesta.messageParams).toEqual({ folio: 'X' });
  });
});

describe('interpolate', () => {
  it('reemplaza los marcadores con sus valores', () => {
    expect(interpolate('Orden {{folio}} asignada a {{ nombre }}', { folio: 'ORD-1', nombre: 'Ana' })).toBe('Orden ORD-1 asignada a Ana');
  });

  it('acepta valores numéricos', () => {
    expect(interpolate('Repartidor {{id}}', { id: 7 })).toBe('Repartidor 7');
  });

  it('deja visible un marcador sin valor', () => {
    expect(interpolate('Hola {{nombre}}')).toBe('Hola {{nombre}}');
  });
});
