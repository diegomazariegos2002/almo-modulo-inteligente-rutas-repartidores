import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { esRol } from '../constants/roles.constant';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { NoAutenticadoError } from '../errors/security.errors';
import type { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

interface PeticionConUsuario {
  headers: Record<string, string | string[] | undefined>;
  user?: UsuarioAutenticado;
}

/**
 * Guard global de autenticación.
 *
 * Todo endpoint exige `Authorization: Bearer <jwt>` salvo los marcados con
 * `@Public()`. Si el token es válido deja la identidad en `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<PeticionConUsuario>();
    const token = extraerBearer(request.headers['authorization']);
    if (!token) throw new NoAutenticadoError();

    let claims: unknown;
    try {
      claims = await this.jwt.verifyAsync(token);
    } catch {
      // Firma inválida, token expirado o mal formado: mismo error, sin dar pistas.
      throw new NoAutenticadoError();
    }

    const usuario = aUsuarioAutenticado(claims);
    if (!usuario) throw new NoAutenticadoError();

    request.user = usuario;
    return true;
  }
}

function extraerBearer(header: string | string[] | undefined): string | null {
  if (typeof header !== 'string') return null;

  const [esquema, token] = header.split(' ');
  return esquema?.toLowerCase() === 'bearer' && token ? token : null;
}

/** Valida la forma de los claims: un token firmado pero incompleto no sirve. */
function aUsuarioAutenticado(claims: unknown): UsuarioAutenticado | null {
  if (typeof claims !== 'object' || claims === null) return null;

  const { sub, nombre, rol, permisos, repartidorId } = claims as Record<string, unknown>;
  if (typeof sub !== 'string' || typeof nombre !== 'string' || !esRol(rol)) return null;
  if (!Array.isArray(permisos) || !permisos.every((p) => typeof p === 'string')) return null;

  return { sub, nombre, rol, permisos, repartidorId: typeof repartidorId === 'number' ? repartidorId : null };
}
