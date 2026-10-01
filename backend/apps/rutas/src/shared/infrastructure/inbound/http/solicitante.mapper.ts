import type { UsuarioAutenticado } from '@almo/security';
import type { Solicitante } from '../../../application/solicitante';

/** Traduce la identidad del token a lo que entiende la capa de aplicación. */
export function aSolicitante(usuario: UsuarioAutenticado): Solicitante {
  return { usuarioId: usuario.sub, rol: usuario.rol, repartidorId: usuario.repartidorId };
}
