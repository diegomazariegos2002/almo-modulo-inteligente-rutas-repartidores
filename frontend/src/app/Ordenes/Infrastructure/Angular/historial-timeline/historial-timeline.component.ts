import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FechaLocalPipe } from '@shared/Infrastructure/Angular/fecha-local/fecha-local.pipe';
import { CambioEstado } from '../../../Domain/orden.models';

/** Línea de tiempo con los cambios de estado de una orden, del más antiguo al más reciente. */
@Component({
  selector: 'app-historial-timeline',
  imports: [FechaLocalPipe],
  templateUrl: './historial-timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialTimelineComponent {
  readonly historial = input.required<readonly CambioEstado[]>();
}
