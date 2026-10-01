import { ApiProperty } from '@nestjs/swagger';
import {
  DESCRIPCION_ESTADO_ORDEN,
  type EstadoOrden,
  ESTADOS_PARADA_PENDIENTE,
} from '../../../../../shared/domain/value-objects/estado-orden.vo';
import { DESCRIPCION_ESTADO_REPARTIDOR } from '../../../../domain/value-objects/estado-repartidor.vo';
import type { Ruta } from '../../../../domain/value-objects/ruta.vo';
import { RepartidorBaseResponseDto } from './repartidor.response.dto';

export class ParadaRutaResponseDto {
  @ApiProperty({ example: 1, description: 'Orden de visita dentro de la ruta optimizada.' })
  secuencia!: number;

  @ApiProperty({ example: 'ORD-000003' })
  folio!: string;

  @ApiProperty({ example: 14.6229 })
  lat!: number;

  @ApiProperty({ example: -90.5155 })
  lng!: number;

  @ApiProperty({ example: 4.5, description: 'Peso en kilogramos.' })
  peso!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Zona 4, Ciudad de Guatemala' })
  direccion!: string | null;

  @ApiProperty({ enum: ESTADOS_PARADA_PENDIENTE, example: 'ASIGNADA' })
  estado!: EstadoOrden;

  @ApiProperty({ example: 'Asignada' })
  estadoDescripcion!: string;

  @ApiProperty({
    example: 2.1,
    description: 'Distancia estimada (Haversine) desde la parada anterior; en la primera, desde la posición actual del repartidor.',
  })
  distanciaDesdeAnteriorKm!: number;

  @ApiProperty({ example: 2.1 })
  distanciaAcumuladaKm!: number;
}

export class RutaResponseDto {
  @ApiProperty({ type: RepartidorBaseResponseDto })
  repartidor!: RepartidorBaseResponseDto;

  @ApiProperty({ type: [ParadaRutaResponseDto], description: 'Paradas pendientes en el orden optimizado.' })
  paradas!: ParadaRutaResponseDto[];

  @ApiProperty({ example: 2 })
  totalParadas!: number;

  @ApiProperty({ example: 4.21 })
  distanciaTotalKm!: number;

  @ApiProperty({ type: String, format: 'date-time', description: 'Instante en que se calculó la ruta (puede venir de caché).' })
  calculadaEn!: string;

  static fromDomain(ruta: Ruta): RutaResponseDto {
    const dto = new RutaResponseDto();
    dto.repartidor = {
      ...ruta.repartidor,
      estadoDescripcion: DESCRIPCION_ESTADO_REPARTIDOR[ruta.repartidor.estado],
    };
    dto.paradas = ruta.paradas.map((parada) => ({
      secuencia: parada.secuencia,
      folio: parada.folio,
      lat: parada.lat,
      lng: parada.lng,
      peso: parada.pesoKg,
      direccion: parada.direccion,
      estado: parada.estado,
      estadoDescripcion: DESCRIPCION_ESTADO_ORDEN[parada.estado],
      distanciaDesdeAnteriorKm: parada.distanciaDesdeAnteriorKm,
      distanciaAcumuladaKm: parada.distanciaAcumuladaKm,
    }));
    dto.totalParadas = ruta.totalParadas;
    dto.distanciaTotalKm = ruta.distanciaTotalKm;
    dto.calculadaEn = ruta.calculadaEn;
    return dto;
  }
}
