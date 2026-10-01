import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  LAT_MAX,
  LAT_MIN,
  LNG_MAX,
  LNG_MIN,
  MENSAJE_LAT_INVALIDA,
  MENSAJE_LNG_INVALIDA,
} from '../../../../../shared/domain/value-objects/coordenada.vo';
import { MENSAJE_PESO_INVALIDO, PESO_MAXIMO_KG } from '../../../../../shared/domain/value-objects/peso.vo';

/*
 * Cada campo usa UN mismo mensaje en todos sus validadores: sea cual sea la
 * regla que falle, el usuario recibe la instrucción completa para corregirlo.
 * `IsNumber` rechaza textos numéricos ("14.6"), NaN e infinitos.
 */
const SOLO_NUMEROS = { allowNaN: false, allowInfinity: false };

export class CrearOrdenRequestDto {
  @ApiProperty({ example: 14.6229, minimum: LAT_MIN, maximum: LAT_MAX, description: 'Latitud del destino en grados decimales.' })
  @IsNumber(SOLO_NUMEROS, { message: MENSAJE_LAT_INVALIDA })
  @Min(LAT_MIN, { message: MENSAJE_LAT_INVALIDA })
  @Max(LAT_MAX, { message: MENSAJE_LAT_INVALIDA })
  lat!: number;

  @ApiProperty({ example: -90.5155, minimum: LNG_MIN, maximum: LNG_MAX, description: 'Longitud del destino en grados decimales.' })
  @IsNumber(SOLO_NUMEROS, { message: MENSAJE_LNG_INVALIDA })
  @Min(LNG_MIN, { message: MENSAJE_LNG_INVALIDA })
  @Max(LNG_MAX, { message: MENSAJE_LNG_INVALIDA })
  lng!: number;

  @ApiProperty({ example: 4.5, maximum: PESO_MAXIMO_KG, description: 'Peso del paquete en kilogramos: mayor que 0 y hasta 50.' })
  @IsNumber(SOLO_NUMEROS, { message: MENSAJE_PESO_INVALIDO })
  @Min(0.01, { message: MENSAJE_PESO_INVALIDO })
  @Max(PESO_MAXIMO_KG, { message: MENSAJE_PESO_INVALIDO })
  peso!: number;

  @ApiPropertyOptional({ example: 'Zona 4, Ciudad de Guatemala', maxLength: 120, description: 'Referencia de texto del destino.' })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto de hasta 120 caracteres.' })
  @MaxLength(120, { message: 'La dirección debe ser un texto de hasta 120 caracteres.' })
  direccion?: string;
}
