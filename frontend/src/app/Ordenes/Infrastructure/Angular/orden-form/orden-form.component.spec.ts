import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuevaOrden } from '../../../Domain/orden.models';
import { OrdenFormComponent } from './orden-form.component';

describe('OrdenFormComponent', () => {
  let fixture: ComponentFixture<OrdenFormComponent>;
  let elemento: HTMLElement;
  let emitidas: NuevaOrden[];

  function control(nombre: string): HTMLInputElement {
    return elemento.querySelector(`[formControlName="${nombre}"]`) as HTMLInputElement;
  }

  function escribir(nombre: string, valor: string): void {
    const campo = control(nombre);
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function elegirZona(nombre: string): void {
    const selector = elemento.querySelector('select') as HTMLSelectElement;
    const opcion = Array.from(selector.options).find((o) => o.textContent?.trim() === nombre);
    selector.value = opcion?.value ?? '';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function enviar(): void {
    (elemento.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function errores(): string[] {
    return Array.from(elemento.querySelectorAll('mat-error')).map(
      (error) => error.textContent?.trim() ?? '',
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OrdenFormComponent] });
    fixture = TestBed.createComponent(OrdenFormComponent);
    elemento = fixture.nativeElement as HTMLElement;
    emitidas = [];
    fixture.componentInstance.crear.subscribe((orden) => emitidas.push(orden));
    fixture.detectChanges();
  });

  it('ofrece las trece zonas de referencia además de las coordenadas manuales', () => {
    expect(elemento.querySelectorAll('select option').length).toBe(14);
  });

  it('al elegir una zona llena la latitud, la longitud y la dirección', () => {
    elegirZona('Zona 4 — Cuatro Grados Norte');

    expect(control('lat').value).toBe('14.6229');
    expect(control('lng').value).toBe('-90.5155');
    expect(control('direccion').value).toBe('Zona 4 — Cuatro Grados Norte');
  });

  it('deselecciona la zona cuando el usuario retoca las coordenadas', () => {
    elegirZona('Zona 4 — Cuatro Grados Norte');

    escribir('lat', '14.7');
    fixture.detectChanges();

    const selector = elemento.querySelector('select') as HTMLSelectElement;
    expect(selector.selectedOptions[0].textContent?.trim()).toBe('Coordenadas manuales');
    expect(control('lng').value).toBe('-90.5155');
  });

  it('emite la orden con valores numéricos y la dirección sin espacios sobrantes', () => {
    escribir('lat', '14.6229');
    escribir('lng', '-90.5155');
    escribir('peso', '4.5');
    escribir('direccion', '  Zona 4, Ciudad de Guatemala  ');

    enviar();

    expect(emitidas).toEqual([
      { lat: 14.6229, lng: -90.5155, peso: 4.5, direccion: 'Zona 4, Ciudad de Guatemala' },
    ]);
  });

  it('omite la dirección cuando se deja en blanco', () => {
    escribir('lat', '14.6229');
    escribir('lng', '-90.5155');
    escribir('peso', '4.5');

    enviar();

    expect(emitidas).toEqual([{ lat: 14.6229, lng: -90.5155, peso: 4.5 }]);
  });

  it('acepta los valores límite del contrato', () => {
    escribir('lat', '-90');
    escribir('lng', '180');
    escribir('peso', '50');

    enviar();

    expect(emitidas).toEqual([{ lat: -90, lng: 180, peso: 50 }]);
  });

  it('no emite y pide cada dato obligatorio si se envía vacío', () => {
    enviar();

    expect(emitidas).toEqual([]);
    expect(errores()).toEqual([
      'Ingresa la latitud como un número.',
      'Ingresa la longitud como un número.',
      'Ingresa el peso como un número.',
    ]);
  });

  it('trata un texto no numérico como dato faltante', () => {
    escribir('lat', 'catorce');
    escribir('lng', '-90.5155');
    escribir('peso', '4.5');

    enviar();

    expect(emitidas).toEqual([]);
    expect(errores()).toEqual(['Ingresa la latitud como un número.']);
  });

  it('rechaza las coordenadas fuera de rango', () => {
    escribir('lat', '90.01');
    escribir('lng', '-180.5');
    escribir('peso', '4.5');

    enviar();

    expect(emitidas).toEqual([]);
    expect(errores()).toEqual([
      'La latitud debe estar entre -90 y 90.',
      'La longitud debe estar entre -180 y 180.',
    ]);
  });

  it('rechaza un peso de cero, negativo o mayor que el máximo', () => {
    escribir('lat', '14.6229');
    escribir('lng', '-90.5155');

    for (const [peso, mensaje] of [
      ['0', 'El peso debe ser mayor que 0.'],
      ['-3', 'El peso debe ser mayor que 0.'],
      ['50.01', 'El peso no puede superar 50 kg.'],
    ]) {
      escribir('peso', peso);
      enviar();

      expect(errores()).toEqual([mensaje]);
    }
    expect(emitidas).toEqual([]);
  });

  it('rechaza una dirección de más de 120 caracteres', () => {
    escribir('lat', '14.6229');
    escribir('lng', '-90.5155');
    escribir('peso', '4.5');
    escribir('direccion', 'x'.repeat(121));

    enviar();

    expect(emitidas).toEqual([]);
    expect(errores()).toEqual(['La dirección no puede superar 120 caracteres.']);
  });

  it('muestra en su campo el mensaje con el que el servidor rechazó un dato', () => {
    fixture.componentRef.setInput('erroresServidor', [
      { campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' },
    ]);
    fixture.detectChanges();

    expect(errores()).toEqual(['El peso debe ser mayor que 0 y no superar 50 kg.']);
  });

  it('descarta el mensaje del servidor cuando el usuario corrige el campo', () => {
    fixture.componentRef.setInput('erroresServidor', [
      { campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' },
    ]);
    fixture.detectChanges();

    escribir('peso', '10');
    fixture.detectChanges();

    expect(errores()).toEqual([]);
  });

  it('bloquea el botón de envío mientras la orden se está creando', () => {
    fixture.componentRef.setInput('enviando', true);
    fixture.detectChanges();

    const boton = elemento.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBeTrue();
    expect(boton.textContent).toContain('Creando orden…');
  });
});
