import { signal } from '@angular/core';
import { SesionContract } from '../../../Application/contracts/sesion.contract';
import { CuentaDemo, PERMISOS, UsuarioPlain } from '../../../Domain/auth.models';
import { Sesion } from '../../../Domain/sesion.entity';
import { Usuario } from '../../../Domain/usuario.entity';

// Usuarios de ejemplo para stories y pruebas, uno por rol, con los permisos de la
// matriz del contrato (docs/contrato-api.md, secciones 1 y 2).

export const USUARIO_CLIENTE_PLAIN: UsuarioPlain = {
  id: 'cmf0000000000000000000001',
  nombre: 'Cliente Demo',
  correo: 'cliente@almo.test',
  rol: 'CLIENTE',
  repartidorId: null,
  permisos: [PERMISOS.ORDEN_CREAR, PERMISOS.ORDEN_LISTAR],
};

export const USUARIO_REPARTIDOR_PLAIN: UsuarioPlain = {
  id: 'cmf0000000000000000000002',
  nombre: 'Ana López',
  correo: 'repartidor1@almo.test',
  rol: 'REPARTIDOR',
  repartidorId: 1,
  permisos: [PERMISOS.ORDEN_LISTAR, PERMISOS.ORDEN_CAMBIAR_ESTADO, PERMISOS.RUTA_LEER],
};

const USUARIO_ADMIN_PLAIN: UsuarioPlain = {
  id: 'cmf0000000000000000000005',
  nombre: 'Despacho Demo',
  correo: 'admin@almo.test',
  rol: 'ADMIN',
  repartidorId: null,
  permisos: [PERMISOS.ORDEN_LISTAR, PERMISOS.RUTA_LEER, PERMISOS.REPARTIDOR_LISTAR],
};

export const USUARIO_CLIENTE = Usuario.fromPlain(USUARIO_CLIENTE_PLAIN);
export const USUARIO_REPARTIDOR = Usuario.fromPlain(USUARIO_REPARTIDOR_PLAIN);
export const USUARIO_ADMIN = Usuario.fromPlain(USUARIO_ADMIN_PLAIN);

/** Sesión que vence dentro de ocho horas, como las que entrega la API. */
export function crearSesion(usuario: Usuario): Sesion {
  return new Sesion('token-de-prueba', new Date(Date.now() + 8 * 60 * 60 * 1000), usuario);
}

/**
 * Implementación en memoria de `SesionContract`: sustituye al almacenamiento del
 * navegador en stories y pruebas. Sin usuario, arranca sin sesión.
 */
export function crearSesionEnMemoria(usuario: Usuario | null = null): SesionContract {
  const actual = signal(usuario ? crearSesion(usuario) : null);
  return {
    actual: actual.asReadonly(),
    guardar: (sesion) => actual.set(sesion),
    limpiar: () => actual.set(null),
  };
}

export const CUENTAS_DEMO: CuentaDemo[] = [
  { rol: 'CLIENTE', nombre: 'Cliente Demo', correo: 'cliente@almo.test', password: 'demo' },
  { rol: 'REPARTIDOR', nombre: 'Ana López', correo: 'repartidor1@almo.test', password: 'demo' },
  { rol: 'ADMIN', nombre: 'Despacho Demo', correo: 'admin@almo.test', password: 'demo' },
];
