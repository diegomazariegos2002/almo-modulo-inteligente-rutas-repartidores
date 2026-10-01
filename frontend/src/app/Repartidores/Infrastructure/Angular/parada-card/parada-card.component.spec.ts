import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUTA_ANA, RUTA_CARLA } from '../_fixtures/repartidores.fixtures';
import { ParadaCardComponent } from './parada-card.component';

describe('ParadaCardComponent', () => {
  const paradaAsignada = RUTA_ANA.paradas[0];
  const paradaEnRuta = RUTA_CARLA.paradas[0];

  let fixture: ComponentFixture<ParadaCardComponent>;
  let elemento: HTMLElement;
  let entregas: string[];

  function mostrar(inputs: Record<string, unknown>): void {
    for (const [nombre, valor] of Object.entries(inputs)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
  }

  const boton = () => elemento.querySelector('button');

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ParadaCardComponent] });
    fixture = TestBed.createComponent(ParadaCardComponent);
    elemento = fixture.nativeElement as HTMLElement;
    entregas = [];
    fixture.componentInstance.entregar.subscribe((folio) => entregas.push(folio));
  });

  it('muestra el orden de visita, el folio, el destino, el peso y el estado', () => {
    mostrar({ parada: paradaAsignada });

    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Parada 1:');
    expect(texto).toContain('ORD-000003');
    expect(texto).toContain('Zona 4, Ciudad de Guatemala');
    expect(texto).toContain('4.5 kg');
    expect(texto).toContain('Asignada');
  });

  it('en la primera parada mide la distancia desde la posición actual', () => {
    mostrar({ parada: paradaAsignada, primera: true });

    expect(elemento.textContent).toContain('2.1 km');
    expect(elemento.textContent).toContain('desde la posición actual');
  });

  it('en las demás paradas mide la distancia desde la parada anterior y muestra el acumulado', () => {
    mostrar({ parada: RUTA_ANA.paradas[1] });

    expect(elemento.textContent).toContain('3.91 km');
    expect(elemento.textContent).toContain('desde la parada anterior');
    expect(elemento.textContent).toContain('6.02 km');
  });

  it('no ofrece la entrega mientras la orden solo está asignada', () => {
    mostrar({ parada: paradaAsignada });

    expect(boton()).toBeNull();
  });

  it('con la orden en ruta, «Marcar entregada» emite su folio', () => {
    mostrar({ parada: paradaEnRuta });

    boton()?.click();

    expect(boton()?.textContent).toContain('Marcar entregada');
    expect(entregas).toEqual(['ORD-000002']);
  });

  it('en solo lectura no ofrece la entrega aunque la orden esté en ruta', () => {
    mostrar({ parada: paradaEnRuta, soloLectura: true });

    expect(boton()).toBeNull();
  });

  it('deshabilita la entrega mientras hay otra acción en curso', () => {
    mostrar({ parada: paradaEnRuta, ocupada: true });

    boton()?.click();

    expect(boton()?.disabled).toBeTrue();
    expect(entregas).toEqual([]);
  });

  it('indica el progreso y bloquea el botón mientras esta parada se entrega', () => {
    mostrar({ parada: paradaEnRuta, enviando: true });

    expect(boton()?.disabled).toBeTrue();
    expect(boton()?.textContent).toContain('Marcando entregada…');
  });
});
