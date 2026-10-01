import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { NoAutenticadoError, PermisoDenegadoError } from '../errors/security.errors';
import type { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

/**
 * Guard global de autorización por permiso.
 *
 * Compara el código declarado con `@Permission()` contra los permisos del
 * token. Corre después de `JwtAuthGuard`, así que `request.user` ya existe.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const requerido = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    if (!requerido) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>();
    if (!user) throw new NoAutenticadoError();
    if (!user.permisos.includes(requerido)) throw new PermisoDenegadoError(requerido);

    return true;
  }
}
