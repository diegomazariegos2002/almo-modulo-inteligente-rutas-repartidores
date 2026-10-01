import type { Rol } from '@almo/security/constants';

/** Lo que se firma dentro del token: la identidad y lo que puede hacer. */
export interface ClaimsSesion {
  sub: string;
  nombre: string;
  rol: Rol;
  permisos: string[];
  repartidorId: number | null;
}

export interface TokenEmitido {
  accessToken: string;
  /** Vigencia en segundos. */
  expiresIn: number;
}

export abstract class TokenEmisor {
  abstract emitir(claims: ClaimsSesion): Promise<TokenEmitido>;
}
