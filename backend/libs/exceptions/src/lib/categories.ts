import { DomainError } from './domain.error';

/*
 * Categorías de error. Son abstractas a propósito: nadie puede lanzar un
 * "NotFound" genérico; cada servicio declara errores concretos con su `code`.
 */

/** 400 — el dato de entrada tiene forma o rango inválido. */
export abstract class ValidationError extends DomainError {
  readonly httpStatus = 400;
}

/** 401 — no hay identidad válida. */
export abstract class UnauthorizedError extends DomainError {
  readonly httpStatus = 401;
}

/** 403 — hay identidad, pero no alcanza para la operación. */
export abstract class ForbiddenError extends DomainError {
  readonly httpStatus = 403;
}

/** 404 — el recurso no existe. */
export abstract class NotFoundError extends DomainError {
  readonly httpStatus = 404;
}

/** 409 — la operación choca con el estado actual del recurso. */
export abstract class ConflictError extends DomainError {
  readonly httpStatus = 409;
}

/** 422 — dato bien formado que viola una regla de negocio. */
export abstract class UnprocessableError extends DomainError {
  readonly httpStatus = 422;
}

/** 500 — fallo de almacenamiento. El detalle técnico va en `metadata`. */
export abstract class PersistenceError extends DomainError {
  readonly httpStatus = 500;
}

/** 503 — una dependencia no está disponible temporalmente. */
export abstract class ServiceUnavailableError extends DomainError {
  readonly httpStatus = 503;
}
