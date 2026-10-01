import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

/**
 * Página de estado (403, 404). Los textos llegan desde el `data` de la ruta, que el
 * enrutador enlaza con estos inputs (`withComponentInputBinding`).
 */
@Component({
  selector: 'app-pagina-estado',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './pagina-estado.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaEstadoComponent {
  readonly codigo = input.required<number>();
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
}
