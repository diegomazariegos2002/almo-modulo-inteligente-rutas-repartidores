import { Injectable, type PipeTransform } from '@nestjs/common';

/**
 * Normaliza el `:folio` de la ruta (`ord-000001` → `ORD-000001`).
 * No valida el formato: un folio que no existe, tenga la forma que tenga, es un 404.
 */
@Injectable()
export class FolioPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    return valor.trim().toUpperCase();
  }
}
