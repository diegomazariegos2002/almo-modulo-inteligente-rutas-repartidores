import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatedResponse, type DomainError, OkResponse } from '@almo/exceptions';
import { isErr, mapOk, type Result } from '@almo/result';
import { CurrentUser, Permission, PERMISSIONS, ResourceOwnershipPort, type UsuarioAutenticado } from '@almo/security';
import { ESTADO_ORDEN } from '../../../../shared/domain/value-objects/estado-orden.vo';
import { FolioPipe } from '../../../../shared/infrastructure/inbound/http/pipes/folio.pipe';
import { aSolicitante } from '../../../../shared/infrastructure/inbound/http/solicitante.mapper';
import { ApiErrores, ApiRespuestaConMensaje } from '../../../../shared/infrastructure/inbound/http/swagger/api-respuestas.decorator';
import { RECURSO } from '../../../../shared/infrastructure/ownership/rutas-resource-ownership.adapter';
import { CrearOrdenUseCase } from '../../../application/use-cases/crear-orden/crear-orden.use-case';
import { EntregarOrdenUseCase } from '../../../application/use-cases/entregar-orden/entregar-orden.use-case';
import { IniciarRutaUseCase } from '../../../application/use-cases/iniciar-ruta/iniciar-ruta.use-case';
import { ListarOrdenesUseCase } from '../../../application/use-cases/listar-ordenes/listar-ordenes.use-case';
import { ObtenerOrdenUseCase } from '../../../application/use-cases/obtener-orden/obtener-orden.use-case';
import { CambiarEstadoOrdenRequestDto } from './dto/cambiar-estado-orden.request.dto';
import { CrearOrdenRequestDto } from './dto/crear-orden.request.dto';
import { LIMIT_POR_DEFECTO, ListarOrdenesQueryDto, PAGE_POR_DEFECTO } from './dto/listar-ordenes.query.dto';
import { ListadoOrdenesResponseDto, OrdenResponseDto } from './dto/orden.response.dto';

const { ORDEN } = PERMISSIONS.RUTAS;

@ApiTags('Órdenes')
@ApiBearerAuth()
@Controller('ordenes')
export class OrdenesController {
  constructor(
    @Inject(CrearOrdenUseCase) private readonly crearOrden: CrearOrdenUseCase,
    @Inject(ListarOrdenesUseCase) private readonly listarOrdenes: ListarOrdenesUseCase,
    @Inject(ObtenerOrdenUseCase) private readonly obtenerOrden: ObtenerOrdenUseCase,
    @Inject(IniciarRutaUseCase) private readonly iniciarRuta: IniciarRutaUseCase,
    @Inject(EntregarOrdenUseCase) private readonly entregarOrden: EntregarOrdenUseCase,
    @Inject(ResourceOwnershipPort) private readonly ownership: ResourceOwnershipPort,
  ) {}

  @Post()
  @Permission(ORDEN.CREAR)
  @ApiOperation({
    summary: 'Registrar una orden y asignarla automáticamente',
    description:
      'Asigna la orden al repartidor **disponible más cercano** al destino (Haversine) que tenga capacidad, y reordena su ruta. ' +
      'Si nadie puede recibirla queda `PENDIENTE_ASIGNACION` en cola: es un resultado válido (201), no un error. **Rol: CLIENTE.**',
  })
  @ApiRespuestaConMensaje(201, OrdenResponseDto, 'Orden registrada: asignada o en cola.')
  @ApiErrores(400, 401, 403)
  async crear(
    @Body() body: CrearOrdenRequestDto,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<Result<CreatedResponse<OrdenResponseDto>, DomainError>> {
    const result = await this.crearOrden.execute({
      clienteId: user.sub,
      lat: body.lat,
      lng: body.lng,
      peso: body.peso,
      direccion: body.direccion,
    });

    return mapOk(
      result,
      (orden) =>
        new CreatedResponse({
          messageKey: orden.repartidor ? 'success.rutas.orden_asignada' : 'success.rutas.orden_en_cola',
          messageParams: { folio: orden.folio, repartidor: orden.repartidor?.nombre ?? '' },
          data: OrdenResponseDto.fromDomain(orden),
        }),
    );
  }

  @Get()
  @Permission(ORDEN.LISTAR)
  @ApiOperation({
    summary: 'Listar órdenes con filtro por estado y paginación',
    description:
      'De la más reciente a la más antigua. El alcance depende del rol: el CLIENTE ve sus órdenes, el REPARTIDOR las que tiene asignadas y el ADMIN todas.',
  })
  @ApiOkResponse({ type: ListadoOrdenesResponseDto })
  @ApiErrores(400, 401, 403)
  async listar(
    @Query() query: ListarOrdenesQueryDto,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<Result<ListadoOrdenesResponseDto, DomainError>> {
    const result = await this.listarOrdenes.execute({
      solicitante: aSolicitante(user),
      estado: query.estado,
      page: query.page ?? PAGE_POR_DEFECTO,
      limit: query.limit ?? LIMIT_POR_DEFECTO,
    });

    return mapOk(result, ListadoOrdenesResponseDto.fromDomain);
  }

  @Get(':folio')
  @Permission(ORDEN.LISTAR)
  @ApiOperation({ summary: 'Consultar una orden y su historial de estados' })
  @ApiParam({ name: 'folio', example: 'ORD-000001' })
  @ApiOkResponse({ type: OrdenResponseDto })
  @ApiErrores(401, 403, { status: 404, description: '`RUTAS.ORDEN_NO_ENCONTRADA` — el folio no existe.' })
  async obtener(
    @Param('folio', FolioPipe) folio: string,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<Result<OrdenResponseDto, DomainError>> {
    const permitido = await this.ownership.assertOwnership({ resourceType: RECURSO.ORDEN, resourceId: folio, user });
    if (isErr(permitido)) return permitido;

    const result = await this.obtenerOrden.execute(folio);
    return mapOk(result, OrdenResponseDto.fromDomain);
  }

  @Patch(':folio/estado')
  @Permission(ORDEN.CAMBIAR_ESTADO)
  @ApiOperation({
    summary: 'Cambiar el estado de una parada (salir a ruta / marcar entregada)',
    description:
      '`EN_RUTA`: el repartidor sale a ruta; todas sus órdenes asignadas pasan a En Ruta y deja de recibir órdenes nuevas. ' +
      '`ENTREGADA`: marca la parada como entregada (si aún no había salido, la salida se registra en ese momento). ' +
      'Al entregar la última parada el repartidor vuelve a Disponible y recibe las órdenes en cola. **Rol: REPARTIDOR, solo sobre sus paradas.**',
  })
  @ApiParam({ name: 'folio', example: 'ORD-000003' })
  @ApiRespuestaConMensaje(200, OrdenResponseDto, 'Estado actualizado.')
  @ApiErrores(400, 401, 403, { status: 404, description: '`RUTAS.ORDEN_NO_ENCONTRADA` — el folio no existe.' }, 409)
  async cambiarEstado(
    @Param('folio', FolioPipe) folio: string,
    @Body() body: CambiarEstadoOrdenRequestDto,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<Result<OkResponse<OrdenResponseDto>, DomainError>> {
    const permitido = await this.ownership.assertOwnership({ resourceType: RECURSO.PARADA, resourceId: folio, user });
    if (isErr(permitido)) return permitido;

    if (body.estado === ESTADO_ORDEN.EN_RUTA) {
      const result = await this.iniciarRuta.execute(folio);
      return mapOk(
        result,
        ({ orden, paradas }) =>
          new OkResponse({
            messageKey: 'success.rutas.ruta_iniciada',
            messageParams: { paradas },
            data: OrdenResponseDto.fromDomain(orden),
          }),
      );
    }

    const result = await this.entregarOrden.execute(folio);
    return mapOk(
      result,
      ({ orden, rutaCompletada }) =>
        new OkResponse({
          messageKey: rutaCompletada ? 'success.rutas.orden_entregada_ruta_completada' : 'success.rutas.orden_entregada',
          messageParams: { folio: orden.folio },
          data: OrdenResponseDto.fromDomain(orden),
        }),
    );
  }
}
