import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SECURITY_OPTIONS, type SecurityModuleOptions } from '@almo/security';
import { type ClaimsSesion, TokenEmisor, type TokenEmitido } from '../../../domain/ports/outbound/token-emisor.port';

/** Firma el JWT (HS256) con el secreto y la vigencia configurados en `SecurityModule`. */
@Injectable()
export class JwtTokenEmisorAdapter extends TokenEmisor {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(SECURITY_OPTIONS) private readonly options: SecurityModuleOptions,
  ) {
    super();
  }

  async emitir(claims: ClaimsSesion): Promise<TokenEmitido> {
    const accessToken = await this.jwt.signAsync({ ...claims });
    return { accessToken, expiresIn: this.options.jwtExpiresInSeconds };
  }
}
