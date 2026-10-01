import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorDetalleDto {
  @ApiProperty({ example: 'peso' })
  campo!: string;

  @ApiProperty({ example: 'El peso debe ser un número mayor que 0 y de hasta 50 kg.' })
  mensaje!: string;
}

/** Forma única de toda respuesta de error. Solo se usa para documentar en Swagger. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'RUTAS.ORDEN_NO_ENCONTRADA', description: 'Código estable, legible por máquina.' })
  code!: string;

  @ApiProperty({ example: 'No existe una orden con el folio ORD-999999.', description: 'Mensaje para mostrar al usuario.' })
  message!: string;

  @ApiProperty({ example: '2026-09-30T18:00:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional({ type: [ErrorDetalleDto], description: 'Solo en errores de validación: un detalle por campo.' })
  details?: ErrorDetalleDto[];
}
