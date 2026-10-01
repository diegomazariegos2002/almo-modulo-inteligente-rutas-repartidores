import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type TipoAviso = 'error' | 'exito' | 'info';

interface AparienciaAviso {
  icono: string;
  clases: string;
}

const APARIENCIA_POR_TIPO: Record<TipoAviso, AparienciaAviso> = {
  error: { icono: 'error', clases: 'border-red-200 bg-red-50 text-red-900' },
  exito: { icono: 'check_circle', clases: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  info: { icono: 'info', clases: 'border-sky-200 bg-sky-50 text-sky-900' },
};

/** Mensaje destacado para errores, confirmaciones o avisos, con una acción opcional. */
@Component({
  selector: 'app-aviso',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './aviso.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisoComponent {
  readonly mensaje = input.required<string>();
  readonly tipo = input<TipoAviso>('info');
  /** Texto del botón de acción (por ejemplo «Reintentar»). Sin texto no hay botón. */
  readonly accion = input<string | null>(null);

  readonly accionado = output<void>();

  protected readonly apariencia = computed(() => APARIENCIA_POR_TIPO[this.tipo()]);
  /** Un error interrumpe al lector de pantalla; el resto se anuncia cuando termina de hablar. */
  protected readonly rol = computed(() => (this.tipo() === 'error' ? 'alert' : 'status'));
}
