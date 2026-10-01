import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Ruta } from '../../../Domain/ruta.entity';
import { RUTA_ANA, RUTA_ANA_PLAIN, RUTA_LARGA } from '../_fixtures/repartidores.fixtures';
import { MapaRutaComponent } from './mapa-ruta.component';

describe('MapaRutaComponent', () => {
  let fixture: ComponentFixture<MapaRutaComponent>;
  let elemento: HTMLElement;

  function mostrar(ruta: Ruta): void {
    fixture.componentRef.setInput('ruta', ruta);
    fixture.detectChanges();
  }

  /** Vértices del trazo: el primero es el repartidor y los demás, las paradas en orden. */
  function vertices(): { x: number; y: number }[] {
    const puntos = elemento.querySelector('polyline')?.getAttribute('points') ?? '';
    return puntos.split(' ').map((par) => {
      const [x, y] = par.split(',').map(Number);
      return { x, y };
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MapaRutaComponent] });
    fixture = TestBed.createComponent(MapaRutaComponent);
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('dibuja un marcador numerado por parada, en el orden de la ruta', () => {
    mostrar(RUTA_LARGA);

    const numeros = Array.from(elemento.querySelectorAll('svg text')).map((texto) =>
      texto.textContent?.trim(),
    );
    expect(elemento.querySelectorAll('svg circle').length).toBe(5);
    expect(numeros).toEqual(['1', '2', '3', '4', '5']);
  });

  it('traza la ruta desde el repartidor pasando por cada parada', () => {
    mostrar(RUTA_ANA);

    expect(vertices().length).toBe(3);
  });

  it('mantiene todos los puntos dentro de la caja del dibujo', () => {
    mostrar(RUTA_LARGA);

    for (const { x, y } of vertices()) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(320);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(220);
    }
  });

  it('pone el norte arriba y el este a la derecha', () => {
    mostrar(RUTA_ANA);
    const [repartidor, primera, segunda] = vertices();

    // Ana sale de la Zona 1. La Zona 4 queda al sur; la Zona 7, al norte y al oeste de la Zona 4.
    expect(primera.y).toBeGreaterThan(repartidor.y);
    expect(segunda.y).toBeLessThan(primera.y);
    expect(segunda.x).toBeLessThan(primera.x);
  });

  it('centra el dibujo cuando todos los puntos coinciden', () => {
    const { repartidor, paradas } = RUTA_ANA_PLAIN;
    const mismaPosicion = { ...paradas[0], lat: repartidor.lat, lng: repartidor.lng };

    mostrar(Ruta.fromPlain({ ...RUTA_ANA_PLAIN, paradas: [mismaPosicion], totalParadas: 1 }));

    expect(vertices()).toEqual([
      { x: 160, y: 110 },
      { x: 160, y: 110 },
    ]);
  });

  it('describe la ruta en texto para quien no ve el dibujo', () => {
    mostrar(RUTA_ANA);

    expect(elemento.querySelector('svg')?.getAttribute('role')).toBe('img');
    expect(elemento.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Mapa esquemático de la ruta de Ana López: 2 paradas, 6.02 km en total.',
    );
  });
});
