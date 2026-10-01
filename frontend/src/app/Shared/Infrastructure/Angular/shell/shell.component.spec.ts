import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CerrarSesionUseCase } from '@auth/Application/cerrar-sesion.use-case';
import { SESION_CONTRACT, SesionContract } from '@auth/Application/contracts/sesion.contract';
import { Usuario } from '@auth/Domain/usuario.entity';
import {
  crearSesionEnMemoria,
  USUARIO_ADMIN,
  USUARIO_CLIENTE,
  USUARIO_REPARTIDOR,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let elemento: HTMLElement;
  let sesion: SesionContract;

  function crear(usuario: Usuario): void {
    sesion = crearSesionEnMemoria(usuario);
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        CerrarSesionUseCase,
        { provide: SESION_CONTRACT, useValue: sesion },
      ],
    });
    fixture = TestBed.createComponent(ShellComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  /** Enlaces de la navegación de escritorio (la barra inferior repite los mismos). */
  const enlaces = () =>
    Array.from(elemento.querySelectorAll('header nav a')).map((enlace) =>
      enlace.textContent?.trim(),
    );

  it('muestra el nombre del producto, el del usuario y su rol', () => {
    crear(USUARIO_REPARTIDOR);

    const cabecera = elemento.querySelector('header')?.textContent ?? '';
    expect(cabecera).toContain('Rutas');
    expect(cabecera).toContain('Ana López');
    expect(cabecera).toContain('Repartidor');
  });

  it('arma la navegación con los permisos de cada usuario', () => {
    crear(USUARIO_CLIENTE);
    expect(enlaces()).toEqual(['Nueva orden', 'Órdenes']);
    TestBed.resetTestingModule();

    crear(USUARIO_REPARTIDOR);
    expect(enlaces()).toEqual(['Mi ruta', 'Órdenes']);
    TestBed.resetTestingModule();

    crear(USUARIO_ADMIN);
    expect(enlaces()).toEqual(['Despacho', 'Órdenes']);
  });

  it('repite la navegación en una barra inferior para pantallas angostas', () => {
    crear(USUARIO_CLIENTE);

    const navegaciones = elemento.querySelectorAll('nav[aria-label="Principal"]');
    expect(navegaciones.length).toBe(2);
    expect(navegaciones[1].querySelectorAll('a').length).toBe(2);
  });

  it('al cerrar sesión la olvida y vuelve al inicio de sesión', () => {
    crear(USUARIO_CLIENTE);
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    (elemento.querySelector('button[aria-label="Cerrar sesión"]') as HTMLButtonElement).click();

    expect(sesion.actual()).toBeNull();
    expect(navegar).toHaveBeenCalledOnceWith(['/login']);
  });
});
