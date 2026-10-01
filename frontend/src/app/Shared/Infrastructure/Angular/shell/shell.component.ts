import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CerrarSesionUseCase } from '@auth/Application/cerrar-sesion.use-case';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { LogoComponent } from '../logo/logo.component';
import { enlacesPara } from './navegacion';

/**
 * Marco de las pantallas con sesión: cabecera, navegación y el contenido de la ruta
 * activa. La navegación va en la cabecera en escritorio y en una barra inferior en
 * pantallas angostas.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    LogoComponent,
  ],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly sesion = inject(SESION_CONTRACT);
  private readonly cerrarSesion = inject(CerrarSesionUseCase);
  private readonly router = inject(Router);

  protected readonly usuario = computed(() => this.sesion.actual()?.usuario ?? null);
  protected readonly enlaces = computed(() => {
    const usuario = this.usuario();
    return usuario ? enlacesPara(usuario) : [];
  });

  protected salir(): void {
    this.cerrarSesion.execute();
    void this.router.navigate(['/login']);
  }
}
