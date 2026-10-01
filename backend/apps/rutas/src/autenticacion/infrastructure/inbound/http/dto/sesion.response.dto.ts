import { ApiProperty } from '@nestjs/swagger';
import { type Rol, ROLES } from '@almo/security/constants';
import type { Sesion } from '../../../../application/use-cases/iniciar-sesion/iniciar-sesion.command';

export class UsuarioSesionResponseDto {
  @ApiProperty({ example: 'cmf0000000000000000000001' })
  id!: string;

  @ApiProperty({ example: 'Cliente Demo' })
  nombre!: string;

  @ApiProperty({ example: 'cliente@almo.test' })
  correo!: string;

  @ApiProperty({ enum: Object.values(ROLES), example: ROLES.CLIENTE })
  rol!: Rol;

  @ApiProperty({ type: Number, nullable: true, example: null, description: 'Repartidor vinculado; solo para el rol REPARTIDOR.' })
  repartidorId!: number | null;

  @ApiProperty({ type: [String], example: ['rutas:orden:crear', 'rutas:orden:listar'] })
  permisos!: string[];
}

export class SesionResponseDto {
  @ApiProperty({ description: 'JWT para enviar en `Authorization: Bearer <token>`.' })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: 28800, description: 'Vigencia del token en segundos.' })
  expiresIn!: number;

  @ApiProperty({ type: UsuarioSesionResponseDto })
  usuario!: UsuarioSesionResponseDto;

  static fromDomain(sesion: Sesion): SesionResponseDto {
    const dto = new SesionResponseDto();
    dto.accessToken = sesion.accessToken;
    dto.tokenType = sesion.tokenType;
    dto.expiresIn = sesion.expiresIn;
    dto.usuario = { ...sesion.usuario };
    return dto;
  }
}
