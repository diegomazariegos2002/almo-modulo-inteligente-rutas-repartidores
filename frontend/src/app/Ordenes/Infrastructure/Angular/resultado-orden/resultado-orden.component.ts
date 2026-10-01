import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ResultadoEscritura } from '@shared/Domain/api.models';
import { Orden } from '../../../Domain/orden.entity';
import { EstadoOrdenBadgeComponent } from '../estado-orden-badge/estado-orden-badge.component';

/**
 * Resultado de crear una orden. Hay dos desenlaces válidos: quedó asignada a un
 * repartidor o quedó en cola. El segundo se presenta como aviso, no como error.
 */
@Component({
  selector: 'app-resultado-orden',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, RouterLink, EstadoOrdenBadgeComponent],
  templateUrl: './resultado-orden.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultadoOrdenComponent {
  readonly resultado = input.required<ResultadoEscritura<Orden>>();

  readonly crearOtra = output<void>();

  protected readonly orden = computed(() => this.resultado().data);
}
