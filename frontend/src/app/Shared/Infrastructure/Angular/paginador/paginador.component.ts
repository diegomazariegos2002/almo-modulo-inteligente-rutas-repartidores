import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MetaPaginacion } from '../../../Domain/api.models';

/**
 * Controles de paginación gobernados por el `meta` que devuelve la API. No guarda
 * estado: solo avisa de la página o del tamaño que pidió el usuario.
 */
@Component({
  selector: 'app-paginador',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './paginador.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginadorComponent {
  readonly meta = input.required<MetaPaginacion>();
  readonly tamanos = input<readonly number[]>([5, 10, 20]);
  readonly deshabilitado = input(false);

  readonly cambioPagina = output<number>();
  readonly cambioLimite = output<number>();

  /** Texto «1–5 de 12», o «0 de 12» si la página pedida queda fuera de rango. */
  protected readonly rango = computed(() => {
    const { page, limit, total } = this.meta();
    const inicio = (page - 1) * limit + 1;
    const fin = Math.min(page * limit, total);
    return inicio <= fin ? `${inicio}–${fin} de ${total}` : `0 de ${total}`;
  });

  protected alElegirLimite(evento: Event): void {
    this.cambioLimite.emit(Number((evento.target as HTMLSelectElement).value));
  }
}
