import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class IniciarSesionRequestDto {
  @ApiProperty({ example: 'cliente@almo.test', description: 'Correo de la cuenta.' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @MaxLength(160, { message: 'El correo no puede superar 160 caracteres.' })
  correo!: string;

  @ApiProperty({ example: '********', description: 'Contraseña de la cuenta (ver README para las cuentas de demostración).' })
  @IsString({ message: 'La contraseña es obligatoria.' })
  @MinLength(1, { message: 'La contraseña es obligatoria.' })
  @MaxLength(200, { message: 'La contraseña no puede superar 200 caracteres.' })
  password!: string;
}
