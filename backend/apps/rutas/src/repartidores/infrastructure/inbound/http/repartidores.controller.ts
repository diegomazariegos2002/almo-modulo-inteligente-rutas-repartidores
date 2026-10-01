import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { DomainError } from '@almo/exceptions';
import { isErr, mapOk, type Result } from '@almo/result';
import { CurrentUser, Permission, PERMISSIONS, ResourceOwnershipPort, type UsuarioAutenticado } from '@almo/security';
import { RepartidorIdPipe } from '../../../../shared/infrastructure/inbound/http/pipes/repartidor-id.pipe';
import { ApiErrores } from '../../../../shared/infrastructure/inbound/http/swagger/api-respuestas.decorator';
import { RECURSO } from '../../../../shared/infrastructure/ownership/rutas-resource-ownership.adapter';
import { ListarRepartidoresUseCase } from '../../../application/use-cases/listar-repartidores/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from '../../../application/use-cases/obtener-ruta-repartidor/obtener-ruta-repartidor.use-case';
import { RepartidorResponseDto } from './dto/repartidor.response.dto';
import { RutaResponseDto } from './dto/ruta.response.dto';

const { RUTA, REPARTIDOR } = PERMISSIONS.RUTAS;

@ApiTags('Repartidores')
@ApiBearerAuth()
@Controller('repartidores')
export class RepartidoresController {
  constructor(
    @Inject(ObtenerRutaRepartidorUseCase) private readonly obtenerRuta: ObtenerRutaRepartidorUseCase,
    @Inject(ListarRepartidoresUseCase) private readonly listarRepartidores: ListarRepartidoresUseCase,
    @Inject(ResourceOwnershipPort) private readonly ownership: ResourceOwnershipPort,
  ) {}

  @Get()
  @Permission(REPARTIDOR.LISTAR)
  @ApiOperation({
    summary: 'Listar repartidores (vista de despacho)',
    description: 'Todos los repartidores con su estado, posición, carga y paradas pendientes. **Rol: ADMIN.**',
  })
  @ApiOkResponse({ type: [RepartidorResponseDto] })
  @ApiErrores(401, 403)
  async listar(): Promise<Result<RepartidorResponseDto[], DomainError>> {
    const result = await this.listarRepartidores.execute();
    return mapOk(result, (repartidores) => repartidores.map(RepartidorResponseDto.fromDomain));
  }

  @Get(':id/ruta')
  @Permission(RUTA.LEER)
  @ApiOperation({
    summary: 'Ruta optimizada de un repartidor',
    description:
      'Paradas pendientes en el orden calculado (vecino más cercano + mejora 2-opt), con la distancia estimada de cada tramo. ' +
      'La respuesta se guarda en caché y se invalida al asignar o entregar. **Rol: REPARTIDOR (solo su ruta) o ADMIN.**',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Id numérico del repartidor.' })
  @ApiOkResponse({ type: RutaResponseDto })
  @ApiErrores(400, 401, 403, { status: 404, description: '`RUTAS.REPARTIDOR_NO_ENCONTRADO` — el id de repartidor no existe.' })
  async ruta(
    @Param('id', RepartidorIdPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<Result<RutaResponseDto, DomainError>> {
    const permitido = await this.ownership.assertOwnership({ resourceType: RECURSO.RUTA_REPARTIDOR, resourceId: String(id), user });
    if (isErr(permitido)) return permitido;

    const result = await this.obtenerRuta.execute(id);
    return mapOk(result, RutaResponseDto.fromDomain);
  }
}
