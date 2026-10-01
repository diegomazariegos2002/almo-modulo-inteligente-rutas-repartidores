import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUTA_LARGA } from '../_fixtures/repartidores.fixtures';
import { ListaParadasComponent } from './lista-paradas.component';

describe('ListaParadasComponent', () => {
  let fixture: ComponentFixture<ListaParadasComponent>;
  let elemento: HTMLElement;

  function mostrar(inputs: Record<string, unknown>): void {
    for (const [nombre, valor] of Object.entries(inputs)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
  }

  const botones = () => Array.from(elemento.querySelectorAll('button'));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ListaParadasComponent] });
    fixture = TestBed.createComponent(ListaParadasComponent);
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('sin paradas muestra un estado vacío en lugar de la lista', () => {
    mostrar({ paradas: [] });

    expect(elemento.textContent).toContain('Sin paradas pendientes');
    expect(elemento.querySelector('ol')).toBeNull();
  });

  it('respeta el orden recibido y solo la primera mide desde la posición actual', () => {
    mostrar({ paradas: RUTA_LARGA.paradas });

    const tarjetas = Array.from(elemento.querySelectorAll('ol > li'));
    const folios = tarjetas.map((tarjeta) => tarjeta.querySelector('.font-mono')?.textContent);
    const desdePosicionActual = tarjetas.map(
      (tarjeta) => tarjeta.textContent?.includes('desde la posición actual') ?? false,
    );

    expect(folios).toEqual(['ORD-000005', 'ORD-000007', 'ORD-000008', 'ORD-000009', 'ORD-000010']);
    expect(desdePosicionActual).toEqual([true, false, false, false, false]);
  });

  it('reenvía el folio de la parada que se quiere entregar', () => {
    mostrar({ paradas: RUTA_LARGA.paradas });
    const entregas: string[] = [];
    fixture.componentInstance.entregar.subscribe((folio) => entregas.push(folio));

    botones()[2].click();

    expect(entregas).toEqual(['ORD-000008']);
  });

  it('con una entrega en curso bloquea todas y señala la que se está procesando', () => {
    mostrar({ paradas: RUTA_LARGA.paradas, ocupada: true, folioEnCurso: 'ORD-000007' });

    expect(botones().every((boton) => boton.disabled)).toBeTrue();
    expect(botones()[1].textContent).toContain('Marcando entregada…');
    expect(botones()[0].textContent).not.toContain('Marcando entregada…');
  });
});
