export interface DomainOkOptions<T> {
  /** Clave i18n del mensaje de éxito, p. ej. `success.rutas.orden_asignada`. */
  messageKey: string;
  messageParams?: Record<string, string | number>;
  data: T;
}

/**
 * Respuesta de éxito con un mensaje para mostrar al usuario.
 *
 * Es el espejo de `DomainError` para el camino feliz: viaja dentro del `ok` de
 * un `Result` y la frontera HTTP lo convierte en `{ statusCode, code, message, data }`.
 * No extiende `Error`: no se lanza, se devuelve.
 */
export abstract class DomainOk<T> {
  abstract readonly httpStatus: number;
  abstract readonly code: string;

  readonly messageKey: string;
  readonly messageParams: Record<string, string | number>;
  readonly data: T;

  constructor(opts: DomainOkOptions<T>) {
    this.messageKey = opts.messageKey;
    this.messageParams = opts.messageParams ?? {};
    this.data = opts.data;
  }
}

/** 200 — operación aplicada. */
export class OkResponse<T> extends DomainOk<T> {
  readonly httpStatus = 200;
  readonly code = 'OK';
}

/** 201 — recurso creado. */
export class CreatedResponse<T> extends DomainOk<T> {
  readonly httpStatus = 201;
  readonly code = 'CREATED';
}
