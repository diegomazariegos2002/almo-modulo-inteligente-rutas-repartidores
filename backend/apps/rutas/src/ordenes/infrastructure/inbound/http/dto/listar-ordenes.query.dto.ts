import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { type EstadoOrden, ESTADOS_ORDEN } from '../../../../../shared/domain/value-objects/estado-orden.vo';

export const PAGE_POR_DEFECTO = 1;
export const LIMIT_POR_DEFECTO = 10;
export const LIMIT_MAXIMO = 100;

const MENSAJE_ESTADO = `El estado debe ser uno de: ${ESTADOS_ORDEN.join(', ')}.`;
const MENSAJE_PAGE = 'La página debe ser un número entero mayor o igual que 1.';
const MENSAJE_LIMIT = `El límite debe ser un número entero entre 1 y ${LIMIT_MAXIMO}.`;

/*
 * El enunciado escribe la consulta como `?estado=&page=&limit=`: un parámetro
 * vacío equivale a no enviarlo, por eso los transformadores lo dejan en `undefined`.
 */
const aEstado = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const texto = value.trim().toUpperCase();
  return texto === '' ? undefined : texto;
};

/** Convierte a número solo lo que es un entero; lo demás queda igual para que falle la validación. */
const aEntero = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const texto = value.trim();
  if (texto === '') return undefined;
  return /^-?\d+$/.test(texto) ? Number(texto) : value;
};

export class ListarOrdenesQueryDto {
  @ApiPropertyOptional({ enum: ESTADOS_ORDEN, description: 'Filtra por estado. Vacío = todos.' })
  @Transform(aEstado)
  @IsOptional()
  @IsIn([...ESTADOS_ORDEN], { message: MENSAJE_ESTADO })
  estado?: EstadoOrden;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: PAGE_POR_DEFECTO, description: 'Número de página, desde 1.' })
  @Transform(aEntero)
  @IsOptional()
  @IsInt({ message: MENSAJE_PAGE })
  @Min(1, { message: MENSAJE_PAGE })
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: LIMIT_MAXIMO, default: LIMIT_POR_DEFECTO, description: 'Órdenes por página.' })
  @Transform(aEntero)
  @IsOptional()
  @IsInt({ message: MENSAJE_LIMIT })
  @Min(1, { message: MENSAJE_LIMIT })
  @Max(LIMIT_MAXIMO, { message: MENSAJE_LIMIT })
  limit?: number;
}
