import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { PERMISOS } from '@auth/Domain/auth.models';
import { CambiarEstadoOrdenUseCase } from '@ordenes/Application/cambiar-estado-orden.use-case';
import { EstadoDestino } from '@ordenes/Domain/orden.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { AvisoComponent, TipoAviso } from '@shared/Infrastructure/Angular/aviso/aviso.component';
import { EstadoVacioComponent } from '@shared/Infrastructure/Angular/estado-vacio/estado-vacio.component';
import { SpinnerComponent } from '@shared/Infrastructure/Angular/spinner/spinner.component';
import { ObtenerRutaRepartidorUseCase } from '../../../Application/obtener-ruta-repartidor.use-case';
import { Ruta } from '../../../Domain/ruta.entity';
import { RutaDetalleComponent } from '../ruta-detalle/ruta-detalle.component';

/**
 * Vista de repartidor: su ruta como lista ordenada de paradas, con las acciones para
 * salir a ruta y marcar cada entrega. Tras cada acción se vuelve a pedir la ruta,
 * porque el servidor la recalcula.
 */
@Component({
  selector: 'app-mi-ruta-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    AvisoComponent,
    EstadoVacioComponent,
    SpinnerComponent,
    RutaDetalleComponent,
  ],
  templateUrl: './mi-ruta-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiRutaPageComponent {
  private readonly obtenerRuta = inject(ObtenerRutaRepartidorUseCase);
  private readonly cambiarEstado = inject(CambiarEstadoOrdenUseCase);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usuario = inject(SESION_CONTRACT).actual()?.usuario;

  /** El repartidor es siempre el del usuario en sesión: nadie consulta aquí la ruta de otro. */
  protected readonly repartidorId = this.usuario?.repartidorId ?? null;
  protected readonly puedeOperar =
    this.usuario?.tienePermiso(PERMISOS.ORDEN_CAMBIAR_ESTADO) ?? false;

  protected readonly ruta = signal<Ruta | null>(null);
  protected readonly cargando = signal(false);
  /** Fallo al cargar la ruta. Sustituye a la ruta en pantalla y ofrece reintentar. */
  protected readonly error = signal<string | null>(null);
  /** Resultado de la última acción: el mensaje del servidor o el motivo del fallo. */
  protected readonly aviso = signal<{ tipo: TipoAviso; mensaje: string } | null>(null);

  protected readonly iniciando = signal(false);
  protected readonly folioEnCurso = signal<string | null>(null);
  protected readonly ocupada = computed(
    () => this.cargando() || this.iniciando() || this.folioEnCurso() !== null,
  );

  constructor() {
    this.cargar();
  }

  protected actualizar(): void {
    this.aviso.set(null);
    this.cargar();
  }

  /** La salida a ruta se registra sobre la primera parada y el servidor la aplica a todas. */
  protected iniciarRuta(): void {
    const primera = this.ruta()?.primeraParada;
    if (primera) {
      this.iniciando.set(true);
      this.ejecutar(primera.folio, 'EN_RUTA');
    }
  }

  protected entregar(folio: string): void {
    this.folioEnCurso.set(folio);
    this.ejecutar(folio, 'ENTREGADA');
  }

  protected cargar(): void {
    if (this.repartidorId === null) {
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.obtenerRuta
      .execute(this.repartidorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ruta) => {
          this.ruta.set(ruta);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(ErrorAplicacion.desde(error).message);
          this.cargando.set(false);
        },
      });
  }

  private ejecutar(folio: string, estado: EstadoDestino): void {
    this.aviso.set(null);

    this.cambiarEstado
      .execute(folio, estado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => this.terminarAccion({ tipo: 'exito', mensaje: resultado.mensaje }),
        error: (error: unknown) =>
          this.terminarAccion({ tipo: 'error', mensaje: ErrorAplicacion.desde(error).message }),
      });
  }

  /** También tras un fallo se recarga: lo habitual es que la ruta en pantalla esté desactualizada. */
  private terminarAccion(aviso: { tipo: TipoAviso; mensaje: string }): void {
    this.aviso.set(aviso);
    this.iniciando.set(false);
    this.folioEnCurso.set(null);
    this.cargar();
  }
}
