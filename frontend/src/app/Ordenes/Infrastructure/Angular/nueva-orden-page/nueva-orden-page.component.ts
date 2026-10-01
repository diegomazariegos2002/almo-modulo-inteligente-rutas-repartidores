import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResultadoEscritura } from '@shared/Domain/api.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { AvisoComponent } from '@shared/Infrastructure/Angular/aviso/aviso.component';
import { CrearOrdenUseCase } from '../../../Application/crear-orden.use-case';
import { Orden } from '../../../Domain/orden.entity';
import { NuevaOrden } from '../../../Domain/orden.models';
import { OrdenFormComponent } from '../orden-form/orden-form.component';
import { ResultadoOrdenComponent } from '../resultado-orden/resultado-orden.component';

/** Vista de cliente: crea una orden y muestra a quién se asignó o si quedó en cola. */
@Component({
  selector: 'app-nueva-orden-page',
  imports: [AvisoComponent, OrdenFormComponent, ResultadoOrdenComponent],
  templateUrl: './nueva-orden-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaOrdenPageComponent {
  private readonly crearOrden = inject(CrearOrdenUseCase);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly enviando = signal(false);
  protected readonly error = signal<ErrorAplicacion | null>(null);
  protected readonly resultado = signal<ResultadoEscritura<Orden> | null>(null);

  /** Errores por campo del servidor; el formulario los muestra junto a cada control. */
  protected readonly erroresDeCampo = computed(() => this.error()?.detalles ?? []);

  protected crear(nueva: NuevaOrden): void {
    this.enviando.set(true);
    this.error.set(null);

    this.crearOrden
      .execute(nueva)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.resultado.set(resultado);
          this.enviando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(ErrorAplicacion.desde(error));
          this.enviando.set(false);
        },
      });
  }

  /** Al descartar el resultado vuelve a mostrarse un formulario nuevo, en blanco. */
  protected crearOtra(): void {
    this.resultado.set(null);
  }
}
