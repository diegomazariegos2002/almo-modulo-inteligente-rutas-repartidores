import { err, ok } from '@almo/result';
import { PERMISSIONS, ROLES } from '@almo/security/constants';
import { RutasPersistenceError } from '../../../../shared/domain/exceptions/rutas-persistence.exception';
import { errorDe, valorDe } from '../../../../testing/escenario.fakes';
import { Usuario, type UsuarioProps } from '../../../domain/entities/usuario.entity';
import { CredencialesInvalidas } from '../../../domain/exceptions/credenciales-invalidas.exception';
import type { PasswordHasher } from '../../../domain/ports/outbound/password-hasher.port';
import type { TokenEmisor } from '../../../domain/ports/outbound/token-emisor.port';
import type { UsuarioRepository } from '../../../domain/ports/outbound/usuario.repository.port';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';

const usuario = (cambios: Partial<UsuarioProps> = {}): Usuario =>
  new Usuario({
    id: 'usu-1',
    nombre: 'Ana López',
    correo: 'repartidor1@almo.test',
    passwordHash: 'hash-guardado',
    rol: ROLES.REPARTIDOR,
    repartidorId: 1,
    activo: true,
    ...cambios,
  });

describe('IniciarSesionUseCase', () => {
  let usuarios: jest.Mocked<UsuarioRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let tokenEmisor: jest.Mocked<TokenEmisor>;
  let useCase: IniciarSesionUseCase;

  beforeEach(() => {
    usuarios = { findByCorreo: jest.fn() };
    passwordHasher = { verificar: jest.fn() };
    tokenEmisor = { emitir: jest.fn().mockResolvedValue({ accessToken: 'jwt-firmado', expiresIn: 28800 }) };
    useCase = new IniciarSesionUseCase(usuarios, passwordHasher, tokenEmisor);
  });

  it('con credenciales válidas emite un token con la identidad y los permisos del rol', async () => {
    usuarios.findByCorreo.mockResolvedValue(ok(usuario()));
    passwordHasher.verificar.mockResolvedValue(true);

    const sesion = valorDe(await useCase.execute({ correo: 'repartidor1@almo.test', password: 'secreta' }));

    const permisos = [PERMISSIONS.RUTAS.ORDEN.LISTAR, PERMISSIONS.RUTAS.ORDEN.CAMBIAR_ESTADO, PERMISSIONS.RUTAS.RUTA.LEER];
    expect(tokenEmisor.emitir).toHaveBeenCalledWith({ sub: 'usu-1', nombre: 'Ana López', rol: 'REPARTIDOR', permisos, repartidorId: 1 });
    expect(sesion).toEqual({
      accessToken: 'jwt-firmado',
      tokenType: 'Bearer',
      expiresIn: 28800,
      usuario: { id: 'usu-1', nombre: 'Ana López', correo: 'repartidor1@almo.test', rol: 'REPARTIDOR', repartidorId: 1, permisos },
    });
  });

  it('nunca devuelve el hash de la contraseña', async () => {
    usuarios.findByCorreo.mockResolvedValue(ok(usuario()));
    passwordHasher.verificar.mockResolvedValue(true);

    const sesion = valorDe(await useCase.execute({ correo: 'repartidor1@almo.test', password: 'secreta' }));

    expect(JSON.stringify(sesion)).not.toContain('hash-guardado');
  });

  it('busca el correo sin espacios y en minúsculas', async () => {
    usuarios.findByCorreo.mockResolvedValue(ok(null));

    await useCase.execute({ correo: '  Repartidor1@ALMO.test ', password: 'x' });

    expect(usuarios.findByCorreo).toHaveBeenCalledWith('repartidor1@almo.test');
  });

  it('cada rol recibe permisos distintos', async () => {
    passwordHasher.verificar.mockResolvedValue(true);

    usuarios.findByCorreo.mockResolvedValue(ok(usuario({ rol: ROLES.CLIENTE, repartidorId: null })));
    const cliente = valorDe(await useCase.execute({ correo: 'c', password: 'x' }));

    usuarios.findByCorreo.mockResolvedValue(ok(usuario({ rol: ROLES.ADMIN, repartidorId: null })));
    const admin = valorDe(await useCase.execute({ correo: 'a', password: 'x' }));

    expect(cliente.usuario.permisos).toEqual([PERMISSIONS.RUTAS.ORDEN.CREAR, PERMISSIONS.RUTAS.ORDEN.LISTAR]);
    expect(admin.usuario.permisos).toContain(PERMISSIONS.RUTAS.REPARTIDOR.LISTAR);
    expect(admin.usuario.permisos).not.toContain(PERMISSIONS.RUTAS.ORDEN.CREAR);
  });

  it.each([
    ['el correo no existe', null, true],
    ['la contraseña no coincide', usuario(), false],
    ['la cuenta está inactiva', usuario({ activo: false }), true],
  ])('responde el mismo 401 si %s', async (_caso, encontrado, passwordCoincide) => {
    usuarios.findByCorreo.mockResolvedValue(ok(encontrado));
    passwordHasher.verificar.mockResolvedValue(passwordCoincide);

    const error = errorDe(await useCase.execute({ correo: 'x@almo.test', password: 'x' }));

    expect(error).toBeInstanceOf(CredencialesInvalidas);
    expect(error.httpStatus).toBe(401);
    expect(error.code).toBe('AUTH.CREDENCIALES_INVALIDAS');
    expect(tokenEmisor.emitir).not.toHaveBeenCalled();
  });

  it('propaga un fallo de persistencia', async () => {
    usuarios.findByCorreo.mockResolvedValue(err(new RutasPersistenceError('findByCorreo', 'timeout')));

    expect(errorDe(await useCase.execute({ correo: 'x', password: 'x' })).httpStatus).toBe(500);
  });
});
