import { UnauthorizedError } from '@almo/exceptions';

/**
 * Correo o contraseña incorrectos.
 * El mensaje es el mismo en ambos casos para no revelar qué correos existen.
 */
export class CredencialesInvalidas extends UnauthorizedError {
  readonly code = 'AUTH.CREDENCIALES_INVALIDAS' as const;

  constructor() {
    super({
      messageKey: 'errors.auth.credenciales_invalidas',
      message: 'Correo o contraseña incorrectos.',
    });
  }
}
