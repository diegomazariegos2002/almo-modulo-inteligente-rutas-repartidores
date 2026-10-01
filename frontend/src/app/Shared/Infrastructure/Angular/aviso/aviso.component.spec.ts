import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvisoComponent } from './aviso.component';

describe('AvisoComponent', () => {
  let fixture: ComponentFixture<AvisoComponent>;
  let elemento: HTMLElement;

  function mostrar(inputs: Record<string, unknown>): void {
    for (const [nombre, valor] of Object.entries(inputs)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AvisoComponent] });
    fixture = TestBed.createComponent(AvisoComponent);
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('anuncia un error como alerta', () => {
    mostrar({ tipo: 'error', mensaje: 'No pudimos conectar con el servidor.' });

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos conectar con el servidor.',
    );
  });

  it('anuncia una confirmación como estado, sin interrumpir', () => {
    mostrar({ tipo: 'exito', mensaje: 'Orden ORD-000006 asignada a Ana López.' });

    expect(elemento.querySelector('[role="alert"]')).toBeNull();
    expect(elemento.querySelector('[role="status"]')?.textContent).toContain('ORD-000006');
  });

  it('solo muestra el botón de acción cuando se le da un texto, y avisa al pulsarlo', () => {
    mostrar({ tipo: 'error', mensaje: 'Falló la carga.' });
    expect(elemento.querySelector('button')).toBeNull();

    let veces = 0;
    fixture.componentInstance.accionado.subscribe(() => veces++);
    mostrar({ accion: 'Reintentar' });
    (elemento.querySelector('button') as HTMLButtonElement).click();

    expect(elemento.querySelector('button')?.textContent).toContain('Reintentar');
    expect(veces).toBe(1);
  });
});
