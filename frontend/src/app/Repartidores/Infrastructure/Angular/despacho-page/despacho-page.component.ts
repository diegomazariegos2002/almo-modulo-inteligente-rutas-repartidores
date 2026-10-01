import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { AvisoComponent } from '@shared/Infrastructure/Angular/aviso/aviso.component';
import { EstadoVacioComponent } from '@shared/Infrastructure/Angular/estado-vacio/estado-vacio.component';
import { SpinnerComponent } from '@shared/Infrastructure/Angular/spinner/spinner.component';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';
import { ListarRepartidoresUseCase } from '../../../Application/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from '../../../Application/obtener-ruta-repartidor.use-case';
import { Repartidor } from '../../../Domain/repartidor.entity';
import { Ruta } from '../../../Domain/ruta.entity';
import { RepartidorCardComponent } from '../repartidor-card/repartidor-card.component';
import { RutaDetalleComponent } from '../ruta-detalle/ruta-detalle.component';

/**
 * Vista de despacho: todos los repartidores y, al elegir uno, su ruta. Es de solo
 * lectura: reutiliza la vista de ruta del repartidor sin sus acciones.
 */
@Component({
  selector: 'app-despacho-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    AvisoComponent,
    EstadoVacioComponent,
    SpinnerComponent,
    RepartidorCardComponent,
    RutaDetalleComponent,
  ],
  templateUrl: './despacho-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DespachoPageComponent {
  private readonly listarRepartidores = inject(ListarRepartidoresUseCase);
  private readonly obtenerRuta = inject(ObtenerRutaRepartidorUseCase);
  private readonly destroyRef = inject(DestroyRef);

  private readonly seccionRuta = viewChild.required<ElementRef<HTMLElement>>('seccionRuta');

  protected readonly repartidores = signal<Repartidor[] | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly seleccionadoId = signal<number | null>(null);
  protected readonly ruta = signal<Ruta | null>(null);
  protected readonly cargandoRuta = signal(false);
  protected readonly errorRuta = signal<string | null>(null);

  private readonly selecciones = new Subject<number>();

  constructor() {
    // `switchMap` descarta la ruta de un repartidor anterior si se elige otro antes de
    // que llegue la respuesta.
    this.selecciones
      .pipe(
        tap((id) => {
          this.seleccionadoId.set(id);
          this.ruta.set(null);
          this.errorRuta.set(null);
          this.cargandoRuta.set(true);
        }),
        switchMap((id) =>
          this.obtenerRuta.execute(id).pipe(
            catchError((error: unknown) => {
              this.errorRuta.set(ErrorAplicacion.desde(error).message);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((ruta) => {
        this.ruta.set(ruta);
        this.cargandoRuta.set(false);
      });

    this.cargar();
  }

  protected verRuta(repartidorId: number): void {
    this.selecciones.next(repartidorId);
    // En pantallas angostas la ruta queda debajo de las tarjetas: se lleva a la vista.
    this.seccionRuta().nativeElement.scrollIntoView({ block: 'start' });
  }

  /** Vuelve a pedir la lista y, si hay un repartidor elegido, también su ruta. */
  protected actualizar(): void {
    this.cargar();
    const seleccionado = this.seleccionadoId();
    if (seleccionado !== null) {
      this.selecciones.next(seleccionado);
    }
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.listarRepartidores
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (repartidores) => {
          this.repartidores.set(repartidores);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(ErrorAplicacion.desde(error).message);
          this.cargando.set(false);
        },
      });
  }
}
