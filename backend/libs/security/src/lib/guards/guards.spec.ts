import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { PERMISSIONS } from '../constants/permissions.constant';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { NoAutenticadoError, PermisoDenegadoError } from '../errors/security.errors';
import type { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';

type Peticion = { headers: Record<string, string | undefined>; user?: UsuarioAutenticado };

function contexto(request: Peticion, tipo = 'http'): ExecutionContext {
  return {
    getType: () => tipo,
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

/** Reflector que responde según la clave de metadata consultada. */
function reflector(metadata: Record<string, unknown>): Reflector {
  return { getAllAndOverride: (clave: string) => metadata[clave] } as unknown as Reflector;
}

const claimsValidos = {
  sub: 'usu-1',
  nombre: 'Ana López',
  rol: 'REPARTIDOR',
  permisos: [PERMISSIONS.RUTAS.RUTA.LEER],
  repartidorId: 1,
};

describe('JwtAuthGuard', () => {
  const verifyAsync = jest.fn();
  const jwt = { verifyAsync } as unknown as JwtService;

  beforeEach(() => verifyAsync.mockReset());

  it('deja pasar un endpoint público sin mirar el token', async () => {
    const guard = new JwtAuthGuard(reflector({ [IS_PUBLIC_KEY]: true }), jwt);

    await expect(guard.canActivate(contexto({ headers: {} }))).resolves.toBe(true);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('rechaza con NoAutenticado si falta el encabezado Authorization', async () => {
    const guard = new JwtAuthGuard(reflector({}), jwt);

    await expect(guard.canActivate(contexto({ headers: {} }))).rejects.toBeInstanceOf(NoAutenticadoError);
  });

  it.each(['Basic abc', 'Bearer', 'token-suelto'])('rechaza un encabezado que no es Bearer: %s', async (authorization) => {
    const guard = new JwtAuthGuard(reflector({}), jwt);

    await expect(guard.canActivate(contexto({ headers: { authorization } }))).rejects.toBeInstanceOf(NoAutenticadoError);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('rechaza un token con firma inválida o expirado', async () => {
    verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const guard = new JwtAuthGuard(reflector({}), jwt);

    await expect(guard.canActivate(contexto({ headers: { authorization: 'Bearer x.y.z' } }))).rejects.toBeInstanceOf(NoAutenticadoError);
  });

  it.each([
    ['sin sub', { ...claimsValidos, sub: undefined }],
    ['con rol desconocido', { ...claimsValidos, rol: 'SUPERUSUARIO' }],
    ['con permisos que no son textos', { ...claimsValidos, permisos: [1, 2] }],
    ['que no es un objeto', 'texto'],
  ])('rechaza un token firmado pero %s', async (_caso, claims) => {
    verifyAsync.mockResolvedValue(claims);
    const guard = new JwtAuthGuard(reflector({}), jwt);

    await expect(guard.canActivate(contexto({ headers: { authorization: 'Bearer x.y.z' } }))).rejects.toBeInstanceOf(NoAutenticadoError);
  });

  it('con un token válido deja la identidad en request.user', async () => {
    verifyAsync.mockResolvedValue({ ...claimsValidos, iat: 1, exp: 2 });
    const guard = new JwtAuthGuard(reflector({}), jwt);
    const request: Peticion = { headers: { authorization: 'bearer x.y.z' } };

    await expect(guard.canActivate(contexto(request))).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('x.y.z');
    expect(request.user).toEqual(claimsValidos);
  });

  it('normaliza repartidorId a null cuando el token no lo trae', async () => {
    verifyAsync.mockResolvedValue({ ...claimsValidos, rol: 'CLIENTE', repartidorId: undefined });
    const guard = new JwtAuthGuard(reflector({}), jwt);
    const request: Peticion = { headers: { authorization: 'Bearer x.y.z' } };

    await guard.canActivate(contexto(request));

    expect(request.user?.repartidorId).toBeNull();
  });

  it('no interviene fuera de HTTP', async () => {
    const guard = new JwtAuthGuard(reflector({}), jwt);

    await expect(guard.canActivate(contexto({ headers: {} }, 'rpc'))).resolves.toBe(true);
  });
});

describe('PermissionsGuard', () => {
  const usuario: UsuarioAutenticado = { ...claimsValidos, rol: 'REPARTIDOR' };

  it('deja pasar un endpoint que no declara permiso', () => {
    const guard = new PermissionsGuard(reflector({}));

    expect(guard.canActivate(contexto({ headers: {} }))).toBe(true);
  });

  it('deja pasar si el token trae el permiso requerido', () => {
    const guard = new PermissionsGuard(reflector({ [PERMISSION_KEY]: PERMISSIONS.RUTAS.RUTA.LEER }));

    expect(guard.canActivate(contexto({ headers: {}, user: usuario }))).toBe(true);
  });

  it('rechaza con PermisoDenegado si el rol no tiene el permiso', () => {
    const guard = new PermissionsGuard(reflector({ [PERMISSION_KEY]: PERMISSIONS.RUTAS.ORDEN.CREAR }));

    expect(() => guard.canActivate(contexto({ headers: {}, user: usuario }))).toThrow(PermisoDenegadoError);
  });

  it('rechaza con NoAutenticado si no hay identidad en la petición', () => {
    const guard = new PermissionsGuard(reflector({ [PERMISSION_KEY]: PERMISSIONS.RUTAS.ORDEN.CREAR }));

    expect(() => guard.canActivate(contexto({ headers: {} }))).toThrow(NoAutenticadoError);
  });

  it('no interviene fuera de HTTP', () => {
    const guard = new PermissionsGuard(reflector({ [PERMISSION_KEY]: PERMISSIONS.RUTAS.ORDEN.CREAR }));

    expect(guard.canActivate(contexto({ headers: {} }, 'rpc'))).toBe(true);
  });
});
