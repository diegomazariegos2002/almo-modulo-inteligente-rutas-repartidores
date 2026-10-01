import { ApiProperty } from '@nestjs/swagger';
import type { Repartidor } from '../../../../domain/entities/repartidor.entity';
import {
  DESCRIPCION_ESTADO_REPARTIDOR,
  ESTADO_REPARTIDOR,
  type EstadoRepartidor,
} from '../../../../domain/value-objects/estado-repartidor.vo';

const ESTADOS = Object.values(ESTADO_REPARTIDOR);

/** Datos de un repartidor comunes a la ruta y al listado de despacho. */
export class RepartidorBaseResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Ana López' })
  nombre!: string;

  @ApiProperty({ enum: ESTADOS, example: ESTADO_REPARTIDOR.DISPONIBLE })
  estado!: EstadoRepartidor;

  @ApiProperty({ example: 'Disponible' })
  estadoDescripcion!: string;

  @ApiProperty({ example: 14.6417, description: 'Latitud de su posición actual.' })
  lat!: number;

  @ApiProperty({ example: -90.5133, description: 'Longitud de su posición actual.' })
  lng!: number;

  @ApiProperty({ example: 50 })
  capacidadKg!: number;

  @ApiProperty({ example: 7.5, description: 'Peso total de sus paradas pendientes.' })
  cargaKg!: number;
}

export class RepartidorResponseDto extends RepartidorBaseResponseDto {
  @ApiProperty({ example: 2 })
  paradasPendientes!: number;

  static fromDomain(repartidor: Repartidor): RepartidorResponseDto {
    const dto = new RepartidorResponseDto();
    dto.id = repartidor.id;
    dto.nombre = repartidor.nombre;
    dto.estado = repartidor.estado;
    dto.estadoDescripcion = DESCRIPCION_ESTADO_REPARTIDOR[repartidor.estado];
    dto.lat = repartidor.lat;
    dto.lng = repartidor.lng;
    dto.capacidadKg = repartidor.capacidadKg;
    dto.cargaKg = repartidor.cargaKg;
    dto.paradasPendientes = repartidor.paradasPendientes;
    return dto;
  }
}
