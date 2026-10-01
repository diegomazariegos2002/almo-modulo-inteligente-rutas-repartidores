import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUTA_ANA, RUTA_CARLA, RUTA_VACIA } from '../_fixtures/repartidores.fixtures';
import { RutaDetalleComponent } from './ruta-detalle.component';

describe('RutaDetalleComponent', () => {
  let fixture: ComponentFixture<RutaDetalleComponent>;
  let elemento: HTMLElement;

  function mostrar(inputs: Record<string, unknown>): void {
    for (const [nombre, valor] of Object.entries(inputs)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
  }

  function boton(texto: string): HTMLButtonElement | undefined {
    return Array.from(elemento.querySelectorAll('button')).find((candidato) =>
      candidato.textContent?.includes(texto),
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RutaDetalleComponent] });
    fixture = TestBed.createComponent(RutaDetalleComponent);
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('muestra el resumen, el mapa y las paradas en el orden de la ruta', () => {
    mostrar({ ruta: RUTA_ANA });

    const folios = Array.from(elemento.querySelectorAll('app-parada-card h3')).map((titulo) =>
      titulo.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(elemento.querySelector('app-resumen-ruta')?.textContent).toContain('Ana López');
    expect(elemento.querySelector('app-mapa-ruta')).not.toBeNull();
    expect(folios).toEqual(['Parada 1: ORD-000003', 'Parada 2: ORD-000004']);
  });

  it('ofrece iniciar la ruta mientras el repartidor no ha salido', () => {
    mostrar({ ruta: RUTA_ANA });
    let veces = 0;
    fixture.componentInstance.iniciar.subscribe(() => veces++);

    boton('Iniciar ruta')?.click();

    expect(veces).toBe(1);
  });

  it('ya en ruta cambia «Iniciar ruta» por la entrega de cada parada', () => {
    mostrar({ ruta: RUTA_CARLA });
    const entregas: string[] = [];
    fixture.componentInstance.entregar.subscribe((folio) => entregas.push(folio));

    boton('Marcar entregada')?.click();

    expect(boton('Iniciar ruta')).toBeUndefined();
    expect(entregas).toEqual(['ORD-000002']);
  });

  it('en solo lectura no ofrece ninguna acción', () => {
    mostrar({ ruta: RUTA_ANA, soloLectura: true });
    expect(elemento.querySelectorAll('button').length).toBe(0);

    mostrar({ ruta: RUTA_CARLA, soloLectura: true });
    expect(elemento.querySelectorAll('button').length).toBe(0);
  });

  it('bloquea las acciones mientras hay una petición en curso', () => {
    mostrar({ ruta: RUTA_ANA, ocupada: true, iniciando: true });

    expect(boton('Iniciando ruta…')?.disabled).toBeTrue();
  });

  it('con la ruta vacía muestra el estado vacío y omite el mapa y el inicio', () => {
    mostrar({ ruta: RUTA_VACIA });

    expect(elemento.textContent).toContain('Sin paradas pendientes');
    expect(elemento.querySelector('app-mapa-ruta')).toBeNull();
    expect(boton('Iniciar ruta')).toBeUndefined();
  });
});
