import { Injectable, type PipeTransform } from '@nestjs/common';
import { EntradaInvalidaError } from '@almo/exceptions';

export const MENSAJE_ID_REPARTIDOR_INVALIDO = 'El id del repartidor debe ser un número entero positivo.';

/**
 * Valida el `:id` de la ruta en la frontera HTTP y lo entrega como número.
 * Un id mal formado es un 400; un id bien formado que no existe es un 404.
 */
@Injectable()
export class RepartidorIdPipe implements PipeTransform<string, number> {
  transform(valor: string): number {
    if (!/^\d{1,9}$/.test(valor) || Number(valor) < 1) {
      throw new EntradaInvalidaError([{ campo: 'id', mensaje: MENSAJE_ID_REPARTIDOR_INVALIDO }]);
    }
    return Number(valor);
  }
}
