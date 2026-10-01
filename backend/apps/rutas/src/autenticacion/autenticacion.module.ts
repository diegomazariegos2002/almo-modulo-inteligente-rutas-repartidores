import { Module } from '@nestjs/common';
import { IniciarSesionUseCase } from './application/use-cases/iniciar-sesion/iniciar-sesion.use-case';
import { PasswordHasher } from './domain/ports/outbound/password-hasher.port';
import { TokenEmisor } from './domain/ports/outbound/token-emisor.port';
import { UsuarioRepository } from './domain/ports/outbound/usuario.repository.port';
import { AutenticacionController } from './infrastructure/inbound/http/autenticacion.controller';
import { PrismaUsuarioRepository } from './infrastructure/outbound/persistence/prisma-usuario.repository';
import { JwtTokenEmisorAdapter } from './infrastructure/outbound/security/jwt-token-emisor.adapter';
import { ScryptPasswordHasherAdapter } from './infrastructure/outbound/security/scrypt-password-hasher.adapter';

@Module({
  controllers: [AutenticacionController],
  providers: [
    { provide: UsuarioRepository, useClass: PrismaUsuarioRepository },
    { provide: PasswordHasher, useClass: ScryptPasswordHasherAdapter },
    { provide: TokenEmisor, useClass: JwtTokenEmisorAdapter },
    IniciarSesionUseCase,
  ],
})
export class AutenticacionModule {}
