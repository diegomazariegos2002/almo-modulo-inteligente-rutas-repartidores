import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Marcador para listas sin resultados y páginas de estado (403, 404). El contenido
 * proyectado se usa para la acción que saca al usuario de ese estado.
 */
@Component({
  selector: 'app-estado-vacio',
  imports: [MatIconModule],
  templateUrl: './estado-vacio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoVacioComponent {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null>(null);
  readonly icono = input('inbox');
}
