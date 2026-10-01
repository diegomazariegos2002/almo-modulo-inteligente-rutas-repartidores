import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EstadoVacioComponent } from '@shared/Infrastructure/Angular/estado-vacio/estado-vacio.component';
import { Parada } from '../../../Domain/parada.entity';
import { ParadaCardComponent } from '../parada-card/parada-card.component';

/** Paradas de una ruta en el orden que calculó el algoritmo. */
@Component({
  selector: 'app-lista-paradas',
  imports: [EstadoVacioComponent, ParadaCardComponent],
  templateUrl: './lista-paradas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaParadasComponent {
  readonly paradas = input.required<readonly Parada[]>();
  readonly soloLectura = input(false);
  /** Hay una acción en curso sobre la ruta: ninguna parada admite otra. */
  readonly ocupada = input(false);
  /** Folio de la parada que se está marcando como entregada, si hay alguna. */
  readonly folioEnCurso = input<string | null>(null);

  readonly entregar = output<string>();
}
