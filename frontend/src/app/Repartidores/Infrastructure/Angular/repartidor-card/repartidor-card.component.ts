import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Repartidor } from '../../../Domain/repartidor.entity';
import { BarraCargaComponent } from '../barra-carga/barra-carga.component';
import { EstadoRepartidorBadgeComponent } from '../estado-repartidor-badge/estado-repartidor-badge.component';

/** Un repartidor en la vista de despacho, con la acción para consultar su ruta. */
@Component({
  selector: 'app-repartidor-card',
  imports: [MatButtonModule, BarraCargaComponent, EstadoRepartidorBadgeComponent],
  templateUrl: './repartidor-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepartidorCardComponent {
  readonly repartidor = input.required<Repartidor>();
  readonly seleccionado = input(false);

  /** Emite el id del repartidor cuya ruta se quiere ver. */
  readonly seleccionar = output<number>();

  protected readonly paradas = computed(() => {
    const pendientes = this.repartidor().paradasPendientes ?? 0;
    return pendientes === 1 ? '1 parada pendiente' : `${pendientes} paradas pendientes`;
  });
}
