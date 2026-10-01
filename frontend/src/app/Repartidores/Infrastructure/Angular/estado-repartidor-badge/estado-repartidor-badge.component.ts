import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, TonoBadge } from '@shared/Infrastructure/Angular/badge/badge.component';
import { EstadoRepartidor } from '../../../Domain/repartidor.models';

const APARIENCIA_POR_ESTADO: Record<EstadoRepartidor, { tono: TonoBadge; icono: string }> = {
  DISPONIBLE: { tono: 'exito', icono: 'person_pin_circle' },
  EN_RUTA: { tono: 'progreso', icono: 'local_shipping' },
};

/** Estado de un repartidor: el color y el icono salen del código; el texto, del servidor. */
@Component({
  selector: 'app-estado-repartidor-badge',
  imports: [BadgeComponent],
  template: `<app-badge
    [etiqueta]="descripcion()"
    [tono]="apariencia().tono"
    [icono]="apariencia().icono"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoRepartidorBadgeComponent {
  readonly estado = input.required<EstadoRepartidor>();
  readonly descripcion = input.required<string>();

  protected readonly apariencia = computed(() => APARIENCIA_POR_ESTADO[this.estado()]);
}
