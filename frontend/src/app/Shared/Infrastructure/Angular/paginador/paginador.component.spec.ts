import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetaPaginacion } from '../../../Domain/api.models';
import { PaginadorComponent } from './paginador.component';

describe('PaginadorComponent', () => {
  let fixture: ComponentFixture<PaginadorComponent>;
  let elemento: HTMLElement;
  let paginas: number[];
  let limites: number[];

  function meta(cambios: Partial<MetaPaginacion> = {}): MetaPaginacion {
    return {
      total: 12,
      page: 2,
      limit: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
      ...cambios,
    };
  }

  function mostrar(valor: MetaPaginacion): void {
    fixture.componentRef.setInput('meta', valor);
    fixture.detectChanges();
  }

  function boton(etiqueta: string): HTMLButtonElement {
    return elemento.querySelector(`button[aria-label="${etiqueta}"]`) as HTMLButtonElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PaginadorComponent] });
    fixture = TestBed.createComponent(PaginadorComponent);
    elemento = fixture.nativeElement as HTMLElement;
    paginas = [];
    limites = [];
    fixture.componentInstance.cambioPagina.subscribe((pagina) => paginas.push(pagina));
    fixture.componentInstance.cambioLimite.subscribe((limite) => limites.push(limite));
  });

  it('muestra el rango visible, el total y la página actual', () => {
    mostrar(meta());

    expect(elemento.textContent).toContain('6–10 de 12');
    expect(elemento.textContent).toContain('Página 2 de 3');
  });

  it('acota el rango de la última página al total de elementos', () => {
    mostrar(meta({ page: 3, hasNextPage: false }));

    expect(elemento.textContent).toContain('11–12 de 12');
  });

  it('no inventa un rango cuando la página pedida queda fuera de rango', () => {
    mostrar(meta({ page: 4, hasNextPage: false }));

    expect(elemento.textContent).toContain('0 de 12');
  });

  it('pide la página anterior y la siguiente', () => {
    mostrar(meta());

    boton('Página anterior').click();
    boton('Página siguiente').click();

    expect(paginas).toEqual([1, 3]);
  });

  it('deshabilita «anterior» en la primera página y «siguiente» en la última', () => {
    mostrar(meta({ page: 1, hasPreviousPage: false }));
    expect(boton('Página anterior').disabled).toBeTrue();
    expect(boton('Página siguiente').disabled).toBeFalse();

    mostrar(meta({ page: 3, hasNextPage: false }));
    expect(boton('Página anterior').disabled).toBeFalse();
    expect(boton('Página siguiente').disabled).toBeTrue();
  });

  it('marca como seleccionado el tamaño de página en uso y avisa cuando cambia', () => {
    mostrar(meta({ limit: 10 }));
    const selector = elemento.querySelector('select') as HTMLSelectElement;
    expect(selector.value).toBe('10');

    selector.value = '20';
    selector.dispatchEvent(new Event('change'));

    expect(limites).toEqual([20]);
  });

  it('bloquea todos los controles mientras se carga una página', () => {
    mostrar(meta());
    fixture.componentRef.setInput('deshabilitado', true);
    fixture.detectChanges();

    expect(boton('Página anterior').disabled).toBeTrue();
    expect(boton('Página siguiente').disabled).toBeTrue();
    expect((elemento.querySelector('select') as HTMLSelectElement).disabled).toBeTrue();
  });
});
