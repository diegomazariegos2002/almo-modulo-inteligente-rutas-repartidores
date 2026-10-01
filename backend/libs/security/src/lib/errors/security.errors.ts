import { ForbiddenError, UnauthorizedError } from '@almo/exceptions';

/** Falta el token, está mal formado, su firma no es válida o ya expiró. */
export class NoAutenticadoError extends UnauthorizedError {
  readonly code = 'AUTH.NO_AUTENTICADO' as const;

  constructor() {
    super({
      messageKey: 'errors.auth.no_autenticado',
      message: 'Debes iniciar sesión para continuar.',
    });
  }
}

/** El rol del usuario no incluye el permiso que exige el endpoint. */
export class PermisoDenegadoError extends ForbiddenError {
  readonly code = 'AUTH.PERMISO_DENEGADO' as const;

  constructor(permiso: string) {
    super({
      messageKey: 'errors.auth.permiso_denegado',
      message: 'Tu rol no tiene permiso para realizar esta acción.',
      metadata: { permiso },
    });
  }
}

/** El recurso existe, pero pertenece a otro usuario. */
export class RecursoAjenoError extends ForbiddenError {
  readonly code = 'AUTH.RECURSO_AJENO' as const;

  constructor(resourceType: string, resourceId: string) {
    super({
      messageKey: 'errors.auth.recurso_ajeno',
      message: 'No tienes acceso a este recurso.',
      metadata: { resourceType, resourceId },
    });
  }
}
