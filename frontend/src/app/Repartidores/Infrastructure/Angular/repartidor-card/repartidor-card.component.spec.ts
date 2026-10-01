import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Repartidor } from '../../../Domain/repartidor.entity';
import { REPARTIDOR_ANA, REPARTIDOR_BRUNO } from '../_fixtures/repartidores.fixtures';
import { RepartidorCardComponent } from './repartidor-card.component';

describe('RepartidorCardComponent', () => {
  let fixture: ComponentFixture<RepartidorCardComponent>;
  let elemento: HTMLElement;

  function mostrar(repartidor: Repartidor, seleccionado = false): void {
    fixture.componentRef.setInput('repartidor', repartidor);
    fixture.componentRef.setInput('seleccionado', seleccionado);
    fixture.detectChanges();
  }

  const boton = () => elemento.querySelector('button') as HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RepartidorCardComponent] });
    fixture = TestBed.createComponent(RepartidorCardComponent);
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('muestra el nombre, el estado, la carga frente a la capacidad y las paradas pendientes', () => {
    mostrar(REPARTIDOR_ANA);

    const texto = (elemento.textContent ?? '').replace(/\s+/g, ' ');
    expect(texto).toContain('Ana López');
    expect(texto).toContain('Disponible');
    expect(texto).toContain('7.5 de 50 kg');
    expect(texto).toContain('2 paradas pendientes');
  });

  it('usa el singular cuando solo queda una parada', () => {
    mostrar(REPARTIDOR_BRUNO);

    expect(elemento.textContent).toContain('1 parada pendiente');
  });

  it('emite el id del repartidor al pedir su ruta', () => {
    mostrar(REPARTIDOR_BRUNO);
    const elegidos: number[] = [];
    fixture.componentInstance.seleccionar.subscribe((id) => elegidos.push(id));

    boton().click();

    expect(elegidos).toEqual([2]);
  });

  it('informa a los lectores de pantalla de cuál está seleccionado', () => {
    mostrar(REPARTIDOR_ANA);
    expect(boton().getAttribute('aria-pressed')).toBe('false');

    mostrar(REPARTIDOR_ANA, true);
    expect(boton().getAttribute('aria-pressed')).toBe('true');
  });
});
