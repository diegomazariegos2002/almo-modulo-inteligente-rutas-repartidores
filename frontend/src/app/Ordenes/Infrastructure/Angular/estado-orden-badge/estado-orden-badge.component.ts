import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, TonoBadge } from '@shared/Infrastructure/Angular/badge/badge.component';
import { EstadoOrden } from '../../../Domain/orden.models';

const APARIENCIA_POR_ESTADO: Record<EstadoOrden, { tono: TonoBadge; icono: string }> = {
  PENDIENTE_ASIGNACION: { tono: 'alerta', icono: 'schedule' },
  ASIGNADA: { tono: 'info', icono: 'assignment_ind' },
  EN_RUTA: { tono: 'progreso', icono: 'local_shipping' },
  ENTREGADA: { tono: 'exito', icono: 'check_circle' },
};

/** Estado de una orden: el color y el icono salen del código; el texto, del servidor. */
@Component({
  selector: 'app-estado-orden-badge',
  imports: [BadgeComponent],
  template: `<app-badge
    [etiqueta]="descripcion()"
    [tono]="apariencia().tono"
    [icono]="apariencia().icono"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoOrdenBadgeComponent {
  readonly estado = input.required<EstadoOrden>();
  readonly descripcion = input.required<string>();

  protected readonly apariencia = computed(() => APARIENCIA_POR_ESTADO[this.estado()]);
}
