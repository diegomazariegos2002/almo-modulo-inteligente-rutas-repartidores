import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ESTADOS_ORDEN, EstadoOrden } from '../../../Domain/orden.models';

interface OpcionFiltro {
  codigo: EstadoOrden | null;
  descripcion: string;
}

// Cada instancia necesita su propio `name`: los radios de un mismo nombre forman un
// solo grupo en todo el documento.
let siguienteGrupo = 0;

/**
 * Filtro por estado del listado de órdenes. Son radios nativos con apariencia de
 * chip, así que el teclado y los lectores de pantalla funcionan sin código extra.
 */
@Component({
  selector: 'app-filtro-estado',
  templateUrl: './filtro-estado.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltroEstadoComponent {
  /** Estado seleccionado; `null` significa «todos». */
  readonly estado = input<EstadoOrden | null>(null);
  readonly deshabilitado = input(false);

  readonly cambio = output<EstadoOrden | null>();

  protected readonly grupo = `filtro-estado-${siguienteGrupo++}`;
  protected readonly opciones: readonly OpcionFiltro[] = [
    { codigo: null, descripcion: 'Todos' },
    ...ESTADOS_ORDEN,
  ];
}
