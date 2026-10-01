import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ORDEN_ASIGNADA, ORDEN_EN_COLA } from '../_fixtures/ordenes.fixtures';
import { ResultadoOrdenComponent } from './resultado-orden.component';

describe('ResultadoOrdenComponent', () => {
  let fixture: ComponentFixture<ResultadoOrdenComponent>;
  let elemento: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResultadoOrdenComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ResultadoOrdenComponent);
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('con la orden asignada muestra el mensaje del servidor, el repartidor y su posición en la ruta', () => {
    fixture.componentRef.setInput('resultado', {
      mensaje: 'Orden ORD-000003 asignada a Ana López.',
      data: ORDEN_ASIGNADA,
    });
    fixture.detectChanges();

    const texto = elemento.textContent ?? '';
    expect(elemento.querySelector('h2')?.textContent).toContain('Orden asignada');
    expect(texto).toContain('Orden ORD-000003 asignada a Ana López.');
    expect(texto).toContain('Ana López');
    expect(texto).toContain('Parada 1');
  });

  it('con la orden en cola lo explica como un resultado válido, sin repartidor', () => {
    fixture.componentRef.setInput('resultado', {
      mensaje: 'Orden ORD-000006 registrada. Queda en cola.',
      data: ORDEN_EN_COLA,
    });
    fixture.detectChanges();

    const texto = elemento.textContent ?? '';
    expect(elemento.querySelector('h2')?.textContent).toContain('Orden en cola');
    expect(texto).toContain('Orden ORD-000006 registrada. Queda en cola.');
    expect(texto).toContain('se asignará');
    expect(texto).not.toContain('Repartidor');
    // Es un aviso de estado, no una alerta de error.
    expect(elemento.querySelector('[role="alert"]')).toBeNull();
    expect(elemento.querySelector('[role="status"]')).not.toBeNull();
  });

  it('avisa cuando el usuario quiere crear otra orden', () => {
    fixture.componentRef.setInput('resultado', { mensaje: 'Creada.', data: ORDEN_ASIGNADA });
    fixture.detectChanges();
    let veces = 0;
    fixture.componentInstance.crearOtra.subscribe(() => veces++);

    (elemento.querySelector('button') as HTMLButtonElement).click();

    expect(veces).toBe(1);
  });
});
