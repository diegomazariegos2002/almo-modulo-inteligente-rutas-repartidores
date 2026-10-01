import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { AvisoComponent } from '@shared/Infrastructure/Angular/aviso/aviso.component';
import { LogoComponent } from '@shared/Infrastructure/Angular/logo/logo.component';
import { IniciarSesionUseCase } from '../../../Application/iniciar-sesion.use-case';
import { Credenciales } from '../../../Domain/auth.models';
import { LoginFormComponent } from '../login-form/login-form.component';

/** Pantalla de inicio de sesión. Al entrar lleva a la pantalla inicial del usuario. */
@Component({
  selector: 'app-login-page',
  imports: [AvisoComponent, LogoComponent, LoginFormComponent],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly iniciarSesion = inject(IniciarSesionUseCase);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Parámetro `?sesion=expirada`: lo agregan el guard y el interceptor al cerrar una sesión vencida. */
  readonly sesion = input<string>();

  protected readonly cuentasDemo = environment.cuentasDemo;
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected ingresar(credenciales: Credenciales): void {
    this.enviando.set(true);
    this.error.set(null);

    this.iniciarSesion
      .execute(credenciales)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // La ruta raíz redirige a la primera pantalla que el usuario puede ver.
        next: () => void this.router.navigateByUrl('/'),
        error: (error: unknown) => {
          this.error.set(ErrorAplicacion.desde(error).message);
          this.enviando.set(false);
        },
      });
  }
}
