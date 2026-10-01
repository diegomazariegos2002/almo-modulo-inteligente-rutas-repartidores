import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ORDEN_ASIGNADA, ORDEN_EN_COLA, ORDEN_ENTREGADA } from '../_fixtures/ordenes.fixtures';
import { OrdenCardComponent } from './orden-card.component';

describe('OrdenCardComponent', () => {
  let fixture: ComponentFixture<OrdenCardComponent>;
  let elemento: HTMLElement;

  const boton = () => elemento.querySelector('button') as HTMLButtonElement;
  const panel = () => elemento.querySelector(`#${boton().getAttribute('aria-controls')}`);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OrdenCardComponent] });
    fixture = TestBed.createComponent(OrdenCardComponent);
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('muestra folio, destino, peso, estado, repartidor y fecha de creación', () => {
    fixture.componentRef.setInput('orden', ORDEN_ASIGNADA);
    fixture.detectChanges();

    const texto = elemento.textContent ?? '';
    expect(texto).toContain('ORD-000003');
    expect(texto).toContain('Zona 4, Ciudad de Guatemala');
    expect(texto).toContain('4.5 kg');
    expect(texto).toContain('Asignada');
    expect(texto).toContain('Ana López');
    expect(elemento.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-09-30T15:00:00.000Z',
    );
  });

  it('indica que una orden en cola aún no tiene repartidor', () => {
    fixture.componentRef.setInput('orden', ORDEN_EN_COLA);
    fixture.detectChanges();

    expect(elemento.textContent).toContain('Sin asignar');
    expect(elemento.textContent).toContain('14.5930, -90.4890');
  });

  it('empieza con el historial oculto y lo muestra al pulsar el botón', () => {
    fixture.componentRef.setInput('orden', ORDEN_ENTREGADA);
    fixture.detectChanges();
    expect(boton().getAttribute('aria-expanded')).toBe('false');
    expect(panel()?.hasAttribute('hidden')).toBeTrue();

    boton().click();
    fixture.detectChanges();

    expect(boton().getAttribute('aria-expanded')).toBe('true');
    expect(boton().textContent).toContain('Ocultar historial');
    expect(panel()?.hasAttribute('hidden')).toBeFalse();
  });

  it('lista el historial en orden cronológico, un elemento por cambio de estado', () => {
    fixture.componentRef.setInput('orden', ORDEN_ENTREGADA);
    fixture.componentRef.setInput('expandida', true);
    fixture.detectChanges();

    const cambios = Array.from(elemento.querySelectorAll('ol li p')).map((p) => p.textContent);
    expect(cambios).toEqual(['Pendiente de Asignación', 'Asignada', 'En Ruta', 'Entregada']);
    expect(elemento.querySelectorAll('ol li time').length).toBe(4);
  });
});
