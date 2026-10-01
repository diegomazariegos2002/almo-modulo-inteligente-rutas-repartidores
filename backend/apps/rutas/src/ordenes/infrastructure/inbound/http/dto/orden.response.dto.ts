import { ApiProperty } from '@nestjs/swagger';
import { DESCRIPCION_ESTADO_ORDEN, type EstadoOrden, ESTADOS_ORDEN } from '../../../../../shared/domain/value-objects/estado-orden.vo';
import type { ListadoOrdenes } from '../../../../application/use-cases/listar-ordenes/listar-ordenes.query';
import type { Orden } from '../../../../domain/entities/orden.entity';

export class RepartidorAsignadoResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Ana López' })
  nombre!: string;
}

export class CambioEstadoResponseDto {
  @ApiProperty({ enum: ESTADOS_ORDEN, example: 'ASIGNADA' })
  estado!: EstadoOrden;

  @ApiProperty({ example: 'Asignada' })
  estadoDescripcion!: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-09-30T15:00:01.000Z' })
  fecha!: Date;
}

export class OrdenResponseDto {
  @ApiProperty({ example: 'ORD-000003', description: 'Identificador público de la orden.' })
  folio!: string;

  @ApiProperty({ example: 14.6229 })
  lat!: number;

  @ApiProperty({ example: -90.5155 })
  lng!: number;

  @ApiProperty({ example: 4.5, description: 'Peso en kilogramos.' })
  peso!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Zona 4, Ciudad de Guatemala' })
  direccion!: string | null;

  @ApiProperty({ enum: ESTADOS_ORDEN, example: 'ASIGNADA' })
  estado!: EstadoOrden;

  @ApiProperty({ example: 'Asignada' })
  estadoDescripcion!: string;

  @ApiProperty({ type: RepartidorAsignadoResponseDto, nullable: true, description: '`null` mientras la orden está en cola.' })
  repartidor!: RepartidorAsignadoResponseDto | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1,
    description: 'Posición en la ruta del repartidor; `null` en cola o ya entregada.',
  })
  secuenciaRuta!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  creadaEn!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  actualizadaEn!: Date;

  @ApiProperty({ type: [CambioEstadoResponseDto], description: 'Un registro por cada cambio de estado, en orden cronológico.' })
  historial!: CambioEstadoResponseDto[];

  static fromDomain(orden: Orden): OrdenResponseDto {
    const dto = new OrdenResponseDto();
    dto.folio = orden.folio;
    dto.lat = orden.lat;
    dto.lng = orden.lng;
    dto.peso = orden.pesoKg;
    dto.direccion = orden.direccion;
    dto.estado = orden.estado;
    dto.estadoDescripcion = DESCRIPCION_ESTADO_ORDEN[orden.estado];
    dto.repartidor = orden.repartidor ? { id: orden.repartidor.id, nombre: orden.repartidor.nombre } : null;
    dto.secuenciaRuta = orden.secuenciaRuta;
    dto.creadaEn = orden.creadaEn;
    dto.actualizadaEn = orden.actualizadaEn;
    dto.historial = orden.historial.map((cambio) => ({
      estado: cambio.estado,
      estadoDescripcion: DESCRIPCION_ESTADO_ORDEN[cambio.estado],
      fecha: cambio.fecha,
    }));
    return dto;
  }
}

export class PaginacionMetaResponseDto {
  @ApiProperty({ example: 5, description: 'Total de órdenes que cumplen el filtro.' })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({ example: false })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class ListadoOrdenesResponseDto {
  @ApiProperty({ type: [OrdenResponseDto] })
  data!: OrdenResponseDto[];

  @ApiProperty({ type: PaginacionMetaResponseDto })
  meta!: PaginacionMetaResponseDto;

  static fromDomain(listado: ListadoOrdenes): ListadoOrdenesResponseDto {
    const totalPages = Math.ceil(listado.total / listado.limit);

    const dto = new ListadoOrdenesResponseDto();
    dto.data = listado.ordenes.map(OrdenResponseDto.fromDomain);
    dto.meta = {
      total: listado.total,
      page: listado.page,
      limit: listado.limit,
      totalPages,
      hasNextPage: listado.page < totalPages,
      hasPreviousPage: listado.page > 1 && totalPages > 0,
    };
    return dto;
  }
}
