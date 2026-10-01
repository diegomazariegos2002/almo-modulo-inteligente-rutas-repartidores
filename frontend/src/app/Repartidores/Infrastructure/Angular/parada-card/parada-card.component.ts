import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EstadoOrdenBadgeComponent } from '@ordenes/Infrastructure/Angular/estado-orden-badge/estado-orden-badge.component';
import { Parada } from '../../../Domain/parada.entity';

/** Una parada de la ruta: destino, distancia desde la parada anterior y su acción de entrega. */
@Component({
  selector: 'app-parada-card',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, EstadoOrdenBadgeComponent],
  templateUrl: './parada-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParadaCardComponent {
  readonly parada = input.required<Parada>();
  /** La distancia de la primera parada se mide desde la posición del repartidor. */
  readonly primera = input(false);
  /** Vista de despacho: se muestra la parada sin acciones. */
  readonly soloLectura = input(false);
  /** Hay otra acción en curso: el botón se deshabilita para no solapar peticiones. */
  readonly ocupada = input(false);
  /** Esta parada se está marcando como entregada. */
  readonly enviando = input(false);

  /** Emite el folio de la orden que se quiere marcar como entregada. */
  readonly entregar = output<string>();

  protected readonly mostrarAccion = computed(
    () => !this.soloLectura() && this.parada().entregable,
  );
}
