import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

/** Inyecta en el handler la identidad que el `JwtAuthGuard` dejó en la petición. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): UsuarioAutenticado => {
  return context.switchToHttp().getRequest<{ user: UsuarioAutenticado }>().user;
});
