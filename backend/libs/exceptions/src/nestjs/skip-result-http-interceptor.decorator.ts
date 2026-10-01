import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const SKIP_RESULT_HTTP_INTERCEPTOR_KEY = 'skipResultHttpInterceptor';

/**
 * Exime a un endpoint de devolver `Result`.
 * Solo para infraestructura técnica que no es una operación de dominio (p. ej. `/health`).
 */
export const SkipResultHttpInterceptor = (): CustomDecorator<string> => SetMetadata(SKIP_RESULT_HTTP_INTERCEPTOR_KEY, true);
