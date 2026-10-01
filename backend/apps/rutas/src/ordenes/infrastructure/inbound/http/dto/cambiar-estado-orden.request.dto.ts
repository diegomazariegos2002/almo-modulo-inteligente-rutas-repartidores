import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';
import { ESTADO_ORDEN } from '../../../../../shared/domain/value-objects/estado-orden.vo';

/** Estados a los que un repartidor puede llevar una parada. */
export const ESTADOS_SOLICITABLES = [ESTADO_ORDEN.EN_RUTA, ESTADO_ORDEN.ENTREGADA] as const;
export type EstadoSolicitable = (typeof ESTADOS_SOLICITABLES)[number];

export class CambiarEstadoOrdenRequestDto {
  @ApiProperty({
    enum: ESTADOS_SOLICITABLES,
    example: ESTADO_ORDEN.ENTREGADA,
    description: '`EN_RUTA`: el repartidor sale a ruta con todas sus órdenes asignadas. `ENTREGADA`: marca la parada como entregada.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsIn([...ESTADOS_SOLICITABLES], { message: 'El estado debe ser EN_RUTA o ENTREGADA.' })
  estado!: EstadoSolicitable;
}
