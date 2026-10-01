import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FechaLocalPipe } from '@shared/Infrastructure/Angular/fecha-local/fecha-local.pipe';
import { Orden } from '../../../Domain/orden.entity';
import { EstadoOrdenBadgeComponent } from '../estado-orden-badge/estado-orden-badge.component';
import { HistorialTimelineComponent } from '../historial-timeline/historial-timeline.component';

/** Una orden del listado. Al expandirla muestra su historial de estados. */
@Component({
  selector: 'app-orden-card',
  imports: [
    DecimalPipe,
    MatIconModule,
    FechaLocalPipe,
    EstadoOrdenBadgeComponent,
    HistorialTimelineComponent,
  ],
  templateUrl: './orden-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenCardComponent {
  readonly orden = input.required<Orden>();
  readonly expandida = model(false);

  /** Enlaza el botón con el panel que controla (`aria-controls`). */
  protected readonly idHistorial = computed(() => `historial-${this.orden().folio}`);
}
