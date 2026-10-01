import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Credenciales } from '../../../Domain/auth.models';
import { CUENTAS_DEMO } from '../_fixtures/usuarios.fixtures';
import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {
  let fixture: ComponentFixture<LoginFormComponent>;
  let elemento: HTMLElement;
  let enviadas: Credenciales[];

  const campo = (nombre: string) =>
    elemento.querySelector(`[formControlName="${nombre}"]`) as HTMLInputElement;

  function escribir(nombre: string, valor: string): void {
    campo(nombre).value = valor;
    campo(nombre).dispatchEvent(new Event('input'));
  }

  function enviar(): void {
    (elemento.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const errores = () =>
    Array.from(elemento.querySelectorAll('mat-error')).map((error) => error.textContent?.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LoginFormComponent] });
    fixture = TestBed.createComponent(LoginFormComponent);
    elemento = fixture.nativeElement as HTMLElement;
    enviadas = [];
    fixture.componentInstance.ingresar.subscribe((credenciales) => enviadas.push(credenciales));
    fixture.componentRef.setInput('cuentasDemo', CUENTAS_DEMO);
    fixture.detectChanges();
  });

  it('emite las credenciales cuando el formulario es válido', () => {
    escribir('correo', 'cliente@almo.test');
    escribir('password', 'secreta');

    enviar();

    expect(enviadas).toEqual([{ correo: 'cliente@almo.test', password: 'secreta' }]);
  });

  it('no emite y pide los datos que faltan', () => {
    enviar();

    expect(enviadas).toEqual([]);
    expect(errores()).toEqual(['Ingresa tu correo.', 'Ingresa tu contraseña.']);
  });

  it('rechaza un correo con formato inválido', () => {
    escribir('correo', 'cliente');
    escribir('password', 'secreta');

    enviar();

    expect(enviadas).toEqual([]);
    expect(errores()).toEqual(['El correo no tiene un formato válido.']);
  });

  it('una cuenta de demostración llena el formulario sin enviarlo', () => {
    const cuentas = elemento.querySelectorAll<HTMLButtonElement>('ul button');
    expect(cuentas.length).toBe(CUENTAS_DEMO.length);

    cuentas[1].click();
    fixture.detectChanges();

    expect(campo('correo').value).toBe('repartidor1@almo.test');
    expect(campo('password').value).toBe('demo');
    expect(enviadas).toEqual([]);
  });

  it('no muestra la sección de cuentas de demostración si no hay ninguna', () => {
    fixture.componentRef.setInput('cuentasDemo', []);
    fixture.detectChanges();

    expect(elemento.textContent).not.toContain('Cuentas de demostración');
  });

  it('muestra el error del último intento como una alerta', () => {
    fixture.componentRef.setInput('error', 'El correo o la contraseña no son correctos.');
    fixture.detectChanges();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'El correo o la contraseña no son correctos.',
    );
  });

  it('bloquea el botón mientras se inicia sesión', () => {
    fixture.componentRef.setInput('enviando', true);
    fixture.detectChanges();

    const boton = elemento.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBeTrue();
    expect(boton.textContent).toContain('Ingresando…');
  });
});
