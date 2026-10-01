import {
  USUARIO_ADMIN,
  USUARIO_CLIENTE,
  USUARIO_REPARTIDOR,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { Usuario } from '@auth/Domain/usuario.entity';
import { enlacesPara } from './navegacion';

describe('enlacesPara', () => {
  const rutas = (usuario: Usuario) => enlacesPara(usuario).map((enlace) => enlace.ruta);

  it('el cliente crea órdenes y consulta las suyas', () => {
    expect(rutas(USUARIO_CLIENTE)).toEqual(['/ordenes/nueva', '/ordenes']);
  });

  it('el repartidor ve su ruta y sus órdenes', () => {
    expect(rutas(USUARIO_REPARTIDOR)).toEqual(['/mi-ruta', '/ordenes']);
  });

  it('despacho ve a los repartidores y todas las órdenes, pero no tiene ruta propia', () => {
    expect(rutas(USUARIO_ADMIN)).toEqual(['/despacho', '/ordenes']);
  });

  it('un usuario sin permisos no ve ningún enlace', () => {
    const sinPermisos = Usuario.fromPlain({ ...USUARIO_CLIENTE.toPlain(), permisos: [] });

    expect(rutas(sinPermisos)).toEqual([]);
  });
});
