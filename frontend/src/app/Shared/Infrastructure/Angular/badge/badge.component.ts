import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type TonoBadge = 'neutro' | 'info' | 'progreso' | 'exito' | 'alerta';

const CLASES_POR_TONO: Record<TonoBadge, string> = {
  neutro: 'bg-slate-100 text-slate-800',
  info: 'bg-blue-100 text-blue-900',
  progreso: 'bg-violet-100 text-violet-900',
  exito: 'bg-emerald-100 text-emerald-900',
  alerta: 'bg-amber-100 text-amber-900',
};

/** Etiqueta compacta. El significado va en el texto y el icono, nunca solo en el color. */
@Component({
  selector: 'app-badge',
  imports: [MatIconModule],
  templateUrl: './badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly etiqueta = input.required<string>();
  readonly tono = input<TonoBadge>('neutro');
  readonly icono = input<string | null>(null);

  protected readonly clases = computed(() => CLASES_POR_TONO[this.tono()]);
}
