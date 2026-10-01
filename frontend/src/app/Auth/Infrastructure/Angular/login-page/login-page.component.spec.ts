import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { of, throwError } from 'rxjs';
import { IniciarSesionUseCase } from '../../../Application/iniciar-sesion.use-case';
import { crearSesion, USUARIO_CLIENTE } from '../_fixtures/usuarios.fixtures';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let elemento: HTMLElement;
  let iniciarSesion: jasmine.SpyObj<IniciarSesionUseCase>;
  let router: jasmine.SpyObj<Router>;

  function escribir(nombre: string, valor: string): void {
    const campo = elemento.querySelector(`[formControlName="${nombre}"]`) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function ingresar(): void {
    escribir('correo', 'cliente@almo.test');
    escribir('password', 'secreta');
    (elemento.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    iniciarSesion = jasmine.createSpyObj<IniciarSesionUseCase>('IniciarSesion', ['execute']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: IniciarSesionUseCase, useValue: iniciarSesion },
        { provide: Router, useValue: router },
      ],
    });
    fixture = TestBed.createComponent(LoginPageComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('ofrece las cinco cuentas de demostración del entorno', () => {
    expect(elemento.querySelectorAll('ul button').length).toBe(5);
  });

  it('con credenciales correctas inicia sesión y va a la pantalla inicial', () => {
    iniciarSesion.execute.and.returnValue(of(crearSesion(USUARIO_CLIENTE)));

    ingresar();

    expect(iniciarSesion.execute).toHaveBeenCalledOnceWith({
      correo: 'cliente@almo.test',
      password: 'secreta',
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/');
  });

  it('con credenciales incorrectas muestra el motivo y permite reintentar', () => {
    iniciarSesion.execute.and.returnValue(
      throwError(
        () =>
          new ErrorAplicacion(
            'El correo o la contraseña no son correctos.',
            'AUTH.CREDENCIALES_INVALIDAS',
          ),
      ),
    );

    ingresar();

    const boton = elemento.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'El correo o la contraseña no son correctos.',
    );
    expect(boton.disabled).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('explica que la sesión expiró cuando se llega con ese motivo', () => {
    expect(elemento.textContent).not.toContain('Tu sesión expiró');

    fixture.componentRef.setInput('sesion', 'expirada');
    fixture.detectChanges();

    expect(elemento.querySelector('[role="status"]')?.textContent).toContain('Tu sesión expiró');
  });
});
