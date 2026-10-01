import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea una fecha con el idioma y la zona horaria del navegador. La API entrega
 * las fechas en UTC; aquí se convierten a la hora local de quien las lee.
 */
@Pipe({ name: 'fechaLocal' })
export class FechaLocalPipe implements PipeTransform {
  private readonly formato = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  transform(fecha: Date | null | undefined): string {
    // `format` lanza una excepción con una fecha inválida y eso rompería la plantilla.
    if (!fecha || Number.isNaN(fecha.getTime())) {
      return '';
    }
    return this.formato.format(fecha);
  }
}
