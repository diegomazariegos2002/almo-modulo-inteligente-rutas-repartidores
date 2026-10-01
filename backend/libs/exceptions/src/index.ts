// Punto de entrada sin dependencias de framework: lo pueden importar las capas
// de dominio y aplicación. Las piezas de NestJS viven en `@almo/exceptions/nestjs`.
export { DomainError } from './lib/domain.error';
export type { DomainErrorOptions, ErrorDetail } from './lib/domain.error';
export {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
  PersistenceError,
  ServiceUnavailableError,
} from './lib/categories';
export { EntradaInvalidaError } from './lib/entrada-invalida.error';
export { DomainOk, OkResponse, CreatedResponse } from './lib/domain-ok';
export type { DomainOkOptions } from './lib/domain-ok';
export { interpolate } from './lib/i18n.utils';
