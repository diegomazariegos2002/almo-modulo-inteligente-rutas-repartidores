import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoOrden } from '../../../Domain/orden.models';
import { FiltroEstadoComponent } from './filtro-estado.component';

describe('FiltroEstadoComponent', () => {
  let fixture: ComponentFixture<FiltroEstadoComponent>;
  let elemento: HTMLElement;

  const radios = () => Array.from(elemento.querySelectorAll<HTMLInputElement>('input[type=radio]'));
  const etiquetas = () =>
    Array.from(elemento.querySelectorAll('label')).map((label) => label.textContent?.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FiltroEstadoComponent] });
    fixture = TestBed.createComponent(FiltroEstadoComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('ofrece «Todos» y los cuatro estados de una orden', () => {
    expect(etiquetas()).toEqual([
      'Todos',
      'Pendiente de Asignación',
      'Asignada',
      'En Ruta',
      'Entregada',
    ]);
  });

  it('marca «Todos» cuando no hay filtro y el estado elegido cuando lo hay', () => {
    expect(radios().map((radio) => radio.checked)).toEqual([true, false, false, false, false]);

    fixture.componentRef.setInput('estado', 'EN_RUTA');
    fixture.detectChanges();

    expect(radios().map((radio) => radio.checked)).toEqual([false, false, false, true, false]);
  });

  it('emite el estado elegido y `null` al volver a «Todos»', () => {
    const cambios: (EstadoOrden | null)[] = [];
    fixture.componentInstance.cambio.subscribe((estado) => cambios.push(estado));

    radios()[2].click();
    radios()[0].click();

    expect(cambios).toEqual(['ASIGNADA', null]);
  });

  it('agrupa los radios con un nombre propio de cada instancia', () => {
    const otra = TestBed.createComponent(FiltroEstadoComponent);
    otra.detectChanges();
    const otroRadio = (otra.nativeElement as HTMLElement).querySelector(
      'input',
    ) as HTMLInputElement;

    expect(new Set(radios().map((radio) => radio.name)).size).toBe(1);
    expect(otroRadio.name).not.toBe(radios()[0].name);
  });

  it('se puede deshabilitar por completo', () => {
    fixture.componentRef.setInput('deshabilitado', true);
    fixture.detectChanges();

    expect((elemento.querySelector('fieldset') as HTMLFieldSetElement).disabled).toBeTrue();
  });
});
