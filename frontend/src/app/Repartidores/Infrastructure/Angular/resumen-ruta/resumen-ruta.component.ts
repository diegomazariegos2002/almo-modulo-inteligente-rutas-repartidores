import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FechaLocalPipe } from '@shared/Infrastructure/Angular/fecha-local/fecha-local.pipe';
import { Ruta } from '../../../Domain/ruta.entity';
import { BarraCargaComponent } from '../barra-carga/barra-carga.component';
import { EstadoRepartidorBadgeComponent } from '../estado-repartidor-badge/estado-repartidor-badge.component';

/** Cabecera de una ruta: quién la hace, cómo va de carga y cuánto le queda por recorrer. */
@Component({
  selector: 'app-resumen-ruta',
  imports: [DecimalPipe, FechaLocalPipe, BarraCargaComponent, EstadoRepartidorBadgeComponent],
  templateUrl: './resumen-ruta.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenRutaComponent {
  readonly ruta = input.required<Ruta>();
}
