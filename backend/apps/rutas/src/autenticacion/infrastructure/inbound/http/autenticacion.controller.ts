import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { DomainError } from '@almo/exceptions';
import { mapOk, type Result } from '@almo/result';
import { Public } from '@almo/security';
import { ApiErrores } from '../../../../shared/infrastructure/inbound/http/swagger/api-respuestas.decorator';
import { IniciarSesionUseCase } from '../../../application/use-cases/iniciar-sesion/iniciar-sesion.use-case';
import { IniciarSesionRequestDto } from './dto/iniciar-sesion.request.dto';
import { SesionResponseDto } from './dto/sesion.response.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AutenticacionController {
  constructor(@Inject(IniciarSesionUseCase) private readonly iniciarSesion: IniciarSesionUseCase) {}

  @Post('login')
  @Public()
  // Un login no crea un recurso: responde 200, no el 201 por defecto de @Post.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión y obtener un token',
    description: 'Devuelve un JWT con el rol y los permisos del usuario. Así se genera el token de cada rol (cliente, repartidor, admin).',
  })
  @ApiOkResponse({ type: SesionResponseDto })
  @ApiErrores(400, { status: 401, description: '`AUTH.CREDENCIALES_INVALIDAS` — correo o contraseña incorrectos.' })
  async login(@Body() body: IniciarSesionRequestDto): Promise<Result<SesionResponseDto, DomainError>> {
    const result = await this.iniciarSesion.execute({ correo: body.correo, password: body.password });
    return mapOk(result, SesionResponseDto.fromDomain);
  }
}
