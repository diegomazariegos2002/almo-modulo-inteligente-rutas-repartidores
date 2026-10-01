import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Ruta } from '../../../Domain/ruta.entity';
import { ListaParadasComponent } from '../lista-paradas/lista-paradas.component';
import { MapaRutaComponent } from '../mapa-ruta/mapa-ruta.component';
import { ResumenRutaComponent } from '../resumen-ruta/resumen-ruta.component';

/**
 * Vista completa de una ruta: resumen, mapa y paradas. La comparten «Mi ruta» (con
 * acciones) y «Despacho» (solo lectura). No hace peticiones: avisa de lo que el
 * usuario quiere hacer y la página decide.
 */
@Component({
  selector: 'app-ruta-detalle',
  imports: [MatButtonModule, ListaParadasComponent, MapaRutaComponent, ResumenRutaComponent],
  templateUrl: './ruta-detalle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RutaDetalleComponent {
  readonly ruta = input.required<Ruta>();
  readonly soloLectura = input(false);
  /** Hay una petición en curso (acción o recarga): se bloquean todas las acciones. */
  readonly ocupada = input(false);
  /** Se está registrando la salida a ruta. */
  readonly iniciando = input(false);
  /** Folio de la parada que se está marcando como entregada, si hay alguna. */
  readonly folioEnCurso = input<string | null>(null);

  readonly iniciar = output<void>();
  readonly entregar = output<string>();

  protected readonly mostrarInicio = computed(
    () => !this.soloLectura() && this.ruta().puedeIniciarse,
  );
}
