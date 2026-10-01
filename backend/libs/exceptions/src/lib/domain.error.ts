/** Detalle por campo de un error de validación. */
export interface ErrorDetail {
  campo: string;
  mensaje: string;
}

export interface DomainErrorOptions {
  /** Clave i18n del mensaje, p. ej. `errors.rutas.orden_no_encontrada`. */
  messageKey: string;
  /** Valores para interpolar en el mensaje traducido (`{{folio}}`). */
  messageParams?: Record<string, string | number>;
  /** Contexto técnico para logs; nunca se envía al cliente. */
  metadata?: Record<string, unknown>;
  /** Mensaje de respaldo para logs y para cuando no hay traducción. */
  message?: string;
  details?: ErrorDetail[];
}

/**
 * Base de todos los errores de negocio.
 *
 * Cada error concreto conoce su `code` estable y su `httpStatus`, de modo que la
 * frontera HTTP no necesita tablas de mapeo ni comparar textos. El mensaje para
 * el usuario se resuelve al final, a partir de `messageKey` y el idioma pedido.
 */
export abstract class DomainError extends Error {
  /** Identificador estable y legible por máquina: `SERVICIO.NOMBRE_ERROR`. */
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  readonly messageKey: string;
  readonly messageParams: Record<string, string | number>;
  readonly metadata: Record<string, unknown>;
  readonly details?: ErrorDetail[];

  constructor(opts: DomainErrorOptions) {
    super(opts.message ?? opts.messageKey);
    this.name = new.target.name;
    this.messageKey = opts.messageKey;
    this.messageParams = opts.messageParams ?? {};
    this.metadata = opts.metadata ?? {};
    this.details = opts.details;
  }
}
