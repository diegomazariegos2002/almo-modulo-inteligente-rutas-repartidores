import { USUARIO_REPARTIDOR_PLAIN } from '../Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { PERMISOS, SesionPlain } from './auth.models';
import { Sesion } from './sesion.entity';
import { Usuario } from './usuario.entity';

describe('Usuario', () => {
  const repartidor = Usuario.fromPlain(USUARIO_REPARTIDOR_PLAIN);

  it('fromPlain() y toPlain() son inversos', () => {
    expect(repartidor.toPlain()).toEqual(USUARIO_REPARTIDOR_PLAIN);
  });

  it('tiene los permisos que le entregó la API y ningún otro', () => {
    expect(repartidor.tienePermiso(PERMISOS.RUTA_LEER)).toBeTrue();
    expect(repartidor.tienePermiso(PERMISOS.ORDEN_CAMBIAR_ESTADO)).toBeTrue();
    expect(repartidor.tienePermiso(PERMISOS.ORDEN_CREAR)).toBeFalse();
    expect(repartidor.tienePermiso(PERMISOS.REPARTIDOR_LISTAR)).toBeFalse();
  });

  it('describe su rol con un texto para la pantalla', () => {
    expect(repartidor.rolDescripcion).toBe('Repartidor');
    expect(Usuario.fromPlain({ ...USUARIO_REPARTIDOR_PLAIN, rol: 'ADMIN' }).rolDescripcion).toBe(
      'Administrador',
    );
  });
});

describe('Sesion', () => {
  const plain: SesionPlain = {
    accessToken: 'token-de-prueba',
    expiraEn: '2026-09-30T23:00:00.000Z',
    usuario: USUARIO_REPARTIDOR_PLAIN,
  };

  it('fromPlain() reconstruye el usuario como entidad y la expiración como Date', () => {
    const sesion = Sesion.fromPlain(plain);

    expect(sesion.accessToken).toBe('token-de-prueba');
    expect(sesion.usuario).toBeInstanceOf(Usuario);
    expect(sesion.expiraEn).toEqual(new Date('2026-09-30T23:00:00.000Z'));
  });

  it('toPlain() devuelve la forma que se guarda en el navegador', () => {
    expect(Sesion.fromPlain(plain).toPlain()).toEqual(plain);
  });

  it('está vigente antes de la hora de expiración y deja de estarlo al alcanzarla', () => {
    const sesion = Sesion.fromPlain(plain);

    expect(sesion.estaVigente(new Date('2026-09-30T22:59:59.000Z'))).toBeTrue();
    expect(sesion.estaVigente(new Date('2026-09-30T23:00:00.000Z'))).toBeFalse();
  });
});
