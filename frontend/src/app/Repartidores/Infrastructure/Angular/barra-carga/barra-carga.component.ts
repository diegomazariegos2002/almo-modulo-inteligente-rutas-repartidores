import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Repartidor } from '../../../Domain/repartidor.entity';

/** Carga actual de un repartidor frente a su capacidad, en texto y como barra. */
@Component({
  selector: 'app-barra-carga',
  imports: [DecimalPipe],
  templateUrl: './barra-carga.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraCargaComponent {
  readonly repartidor = input.required<Repartidor>();
}
