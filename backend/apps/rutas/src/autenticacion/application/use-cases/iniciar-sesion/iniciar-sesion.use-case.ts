import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { err, isErr, ok, type Result } from '@almo/result';
import { permisosDeRol } from '@almo/security/constants';
import { CredencialesInvalidas } from '../../../domain/exceptions/credenciales-invalidas.exception';
import { PasswordHasher } from '../../../domain/ports/outbound/password-hasher.port';
import { TokenEmisor } from '../../../domain/ports/outbound/token-emisor.port';
import { UsuarioRepository } from '../../../domain/ports/outbound/usuario.repository.port';
import type { IniciarSesionCommand, Sesion } from './iniciar-sesion.command';

/**
 * Valida las credenciales y emite el JWT.
 *
 * Los permisos del rol se copian al token: los guards solo comparan códigos y
 * no consultan la base en cada petición.
 */
@Injectable()
export class IniciarSesionUseCase {
  constructor(
    @Inject(UsuarioRepository) private readonly usuarios: UsuarioRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @Inject(TokenEmisor) private readonly tokenEmisor: TokenEmisor,
  ) {}

  async execute(cmd: IniciarSesionCommand): Promise<Result<Sesion, DomainError>> {
    const encontrado = await this.usuarios.findByCorreo(cmd.correo.trim().toLowerCase());
    if (isErr(encontrado)) return encontrado;

    const usuario = encontrado.value;
    // Mismo error si el correo no existe, la cuenta está inactiva o la contraseña no coincide.
    if (!usuario || !usuario.activo) return err(new CredencialesInvalidas());
    if (!(await this.passwordHasher.verificar(cmd.password, usuario.passwordHash))) return err(new CredencialesInvalidas());

    const permisos = permisosDeRol(usuario.rol);
    const token = await this.tokenEmisor.emitir({
      sub: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      permisos,
      repartidorId: usuario.repartidorId,
    });

    return ok({
      accessToken: token.accessToken,
      tokenType: 'Bearer',
      expiresIn: token.expiresIn,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        repartidorId: usuario.repartidorId,
        permisos,
      },
    });
  }
}
