import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AvisoComponent } from '@shared/Infrastructure/Angular/aviso/aviso.component';
import { BadgeComponent } from '@shared/Infrastructure/Angular/badge/badge.component';
import { Credenciales, CuentaDemo, DESCRIPCION_ROL } from '../../../Domain/auth.models';

/**
 * Formulario de inicio de sesión. Las cuentas de demostración solo llenan los
 * campos: quien inicia sesión es siempre el usuario, al pulsar «Ingresar».
 */
@Component({
  selector: 'app-login-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    AvisoComponent,
    BadgeComponent,
  ],
  templateUrl: './login-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  readonly enviando = input(false);
  /** Mensaje del último intento fallido, ya traducido para el usuario. */
  readonly error = input<string | null>(null);
  readonly cuentasDemo = input<readonly CuentaDemo[]>([]);

  readonly ingresar = output<Credenciales>();

  protected readonly descripcionRol = DESCRIPCION_ROL;

  protected readonly formulario = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected usarCuenta(cuenta: CuentaDemo): void {
    this.formulario.setValue({ correo: cuenta.correo, password: cuenta.password });
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.ingresar.emit(this.formulario.getRawValue());
  }
}
