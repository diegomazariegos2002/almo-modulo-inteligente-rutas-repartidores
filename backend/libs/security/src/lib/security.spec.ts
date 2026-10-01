import { PERMISSIONS } from './constants/permissions.constant';
import { esRol, PERMISOS_POR_ROL, permisosDeRol, ROLES } from './constants/roles.constant';
import { NoAutenticadoError, PermisoDenegadoError, RecursoAjenoError } from './errors/security.errors';
import { hashPassword, verifyPassword } from './password/scrypt-password';

describe('Roles y permisos', () => {
  const { ORDEN, RUTA, REPARTIDOR } = PERMISSIONS.RUTAS;

  it('el cliente crea y lista órdenes, pero no cambia estados ni lee rutas', () => {
    expect(permisosDeRol(ROLES.CLIENTE)).toEqual([ORDEN.CREAR, ORDEN.LISTAR]);
  });

  it('el repartidor lista, cambia estados y lee rutas, pero no crea órdenes', () => {
    const permisos = permisosDeRol(ROLES.REPARTIDOR);

    expect(permisos).toEqual(expect.arrayContaining([ORDEN.LISTAR, ORDEN.CAMBIAR_ESTADO, RUTA.LEER]));
    expect(permisos).not.toContain(ORDEN.CREAR);
  });

  it('el admin solo tiene permisos de lectura', () => {
    const permisos = permisosDeRol(ROLES.ADMIN);

    expect(permisos).toEqual([ORDEN.LISTAR, RUTA.LEER, REPARTIDOR.LISTAR]);
    expect(permisos).not.toContain(ORDEN.CREAR);
    expect(permisos).not.toContain(ORDEN.CAMBIAR_ESTADO);
  });

  it('cliente y repartidor no tienen los mismos permisos', () => {
    expect(PERMISOS_POR_ROL.CLIENTE).not.toEqual(PERMISOS_POR_ROL.REPARTIDOR);
  });

  it('permisosDeRol devuelve una copia que no altera la tabla', () => {
    permisosDeRol(ROLES.CLIENTE).push('otro');

    expect(PERMISOS_POR_ROL.CLIENTE).toHaveLength(2);
  });

  it('esRol reconoce solo los roles definidos', () => {
    expect(esRol('CLIENTE')).toBe(true);
    expect(esRol('cliente')).toBe(false);
    expect(esRol('toString')).toBe(false);
    expect(esRol(undefined)).toBe(false);
  });
});

describe('Errores de seguridad', () => {
  it('cada error trae su código y su estado HTTP', () => {
    expect(new NoAutenticadoError()).toMatchObject({ code: 'AUTH.NO_AUTENTICADO', httpStatus: 401 });
    expect(new PermisoDenegadoError('rutas:orden:crear')).toMatchObject({
      code: 'AUTH.PERMISO_DENEGADO',
      httpStatus: 403,
      metadata: { permiso: 'rutas:orden:crear' },
    });
    expect(new RecursoAjenoError('orden', 'ORD-000001')).toMatchObject({ code: 'AUTH.RECURSO_AJENO', httpStatus: 403 });
  });
});

describe('Hash de contraseñas (scrypt)', () => {
  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await hashPassword('secreto-de-prueba');

    await expect(verifyPassword('secreto-de-prueba', hash)).resolves.toBe(true);
    await expect(verifyPassword('otro-secreto', hash)).resolves.toBe(false);
  });

  it('nunca guarda la contraseña en claro y usa una sal distinta cada vez', async () => {
    const [uno, dos] = await Promise.all([hashPassword('igual'), hashPassword('igual')]);

    expect(uno).not.toContain('igual');
    expect(uno).not.toBe(dos);
    expect(uno.startsWith('scrypt$')).toBe(true);
  });

  it.each(['', 'texto-plano', 'bcrypt$abc$def', 'scrypt$solo-sal', 'scrypt$c2Fs$'])(
    'rechaza un hash con formato inválido: %p',
    async (almacenado) => {
      await expect(verifyPassword('x', almacenado)).resolves.toBe(false);
    },
  );
});
