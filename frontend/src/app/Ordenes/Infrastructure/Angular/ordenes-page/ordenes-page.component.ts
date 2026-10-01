import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { PERMISOS } from '@auth/Domain/auth.models';
import { Pagina } from '@shared/Domain/api.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { AvisoComponent } from '@shared/Infrastructure/Angular/aviso/aviso.component';
import { EstadoVacioComponent } from '@shared/Infrastructure/Angular/estado-vacio/estado-vacio.component';
import { PaginadorComponent } from '@shared/Infrastructure/Angular/paginador/paginador.component';
import { SpinnerComponent } from '@shared/Infrastructure/Angular/spinner/spinner.component';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';
import { ListarOrdenesUseCase } from '../../../Application/listar-ordenes.use-case';
import { Orden } from '../../../Domain/orden.entity';
import { EstadoOrden, FiltroOrdenes } from '../../../Domain/orden.models';
import { FiltroEstadoComponent } from '../filtro-estado/filtro-estado.component';
import { OrdenCardComponent } from '../orden-card/orden-card.component';

/** Listado de órdenes con filtro por estado y paginación, ambos resueltos por la API. */
@Component({
  selector: 'app-ordenes-page',
  imports: [
    MatButtonModule,
    RouterLink,
    AvisoComponent,
    EstadoVacioComponent,
    PaginadorComponent,
    SpinnerComponent,
    FiltroEstadoComponent,
    OrdenCardComponent,
  ],
  templateUrl: './ordenes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesPageComponent {
  private readonly listarOrdenes = inject(ListarOrdenesUseCase);

  /** Solo quien puede crear órdenes ve el acceso directo del listado vacío. */
  protected readonly puedeCrear =
    inject(SESION_CONTRACT).actual()?.usuario.tienePermiso(PERMISOS.ORDEN_CREAR) ?? false;

  protected readonly filtro = signal<FiltroOrdenes>({ estado: null, page: 1, limit: 5 });
  protected readonly pagina = signal<Pagina<Orden> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly consultas = new Subject<FiltroOrdenes>();

  constructor() {
    // `switchMap` descarta la respuesta de una consulta anterior si el usuario cambia
    // el filtro o la página antes de que llegue: nunca se pinta un resultado viejo.
    this.consultas
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap((filtro) =>
          this.listarOrdenes.execute(filtro).pipe(
            catchError((error: unknown) => {
              this.error.set(ErrorAplicacion.desde(error).message);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((pagina) => {
        if (pagina) {
          this.pagina.set(pagina);
        }
        this.cargando.set(false);
      });

    this.cargar();
  }

  protected cargar(): void {
    this.consultas.next(this.filtro());
  }

  protected cambiarEstado(estado: EstadoOrden | null): void {
    // Con otro filtro cambia el total de páginas: se vuelve a la primera.
    this.filtro.update((filtro) => ({ ...filtro, estado, page: 1 }));
    this.cargar();
  }

  protected cambiarPagina(page: number): void {
    this.filtro.update((filtro) => ({ ...filtro, page }));
    this.cargar();
  }

  protected cambiarLimite(limit: number): void {
    this.filtro.update((filtro) => ({ ...filtro, limit, page: 1 }));
    this.cargar();
  }
}
