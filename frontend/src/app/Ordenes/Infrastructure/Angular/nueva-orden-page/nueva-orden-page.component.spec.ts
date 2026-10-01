import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResultadoEscritura } from '@shared/Domain/api.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { of, Subject, throwError } from 'rxjs';
import { CrearOrdenUseCase } from '../../../Application/crear-orden.use-case';
import { Orden } from '../../../Domain/orden.entity';
import { ORDEN_ASIGNADA, ORDEN_EN_COLA } from '../_fixtures/ordenes.fixtures';
import { NuevaOrdenPageComponent } from './nueva-orden-page.component';

describe('NuevaOrdenPageComponent', () => {
  let fixture: ComponentFixture<NuevaOrdenPageComponent>;
  let elemento: HTMLElement;
  let crearOrden: jasmine.SpyObj<CrearOrdenUseCase>;

  function escribir(nombre: string, valor: string): void {
    const campo = elemento.querySelector(`[formControlName="${nombre}"]`) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  /** Llena una orden válida y envía el formulario. */
  function enviarOrden(): void {
    escribir('lat', '14.6229');
    escribir('lng', '-90.5155');
    escribir('peso', '4.5');
    (elemento.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    crearOrden = jasmine.createSpyObj<CrearOrdenUseCase>('CrearOrdenUseCase', ['execute']);

    TestBed.configureTestingModule({
      imports: [NuevaOrdenPageComponent],
      providers: [provideRouter([]), { provide: CrearOrdenUseCase, useValue: crearOrden }],
    });
    fixture = TestBed.createComponent(NuevaOrdenPageComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('crea la orden con los datos del formulario', () => {
    crearOrden.execute.and.returnValue(of({ mensaje: 'Creada.', data: ORDEN_ASIGNADA }));

    enviarOrden();

    expect(crearOrden.execute).toHaveBeenCalledOnceWith({ lat: 14.6229, lng: -90.5155, peso: 4.5 });
  });

  it('al asignarse muestra el mensaje del servidor y el repartidor, en lugar del formulario', () => {
    crearOrden.execute.and.returnValue(
      of({ mensaje: 'Orden ORD-000003 asignada a Ana López.', data: ORDEN_ASIGNADA }),
    );

    enviarOrden();

    const resultado = elemento.querySelector('app-resultado-orden');
    expect(resultado?.textContent).toContain('Orden ORD-000003 asignada a Ana López.');
    expect(resultado?.textContent).toContain('Ana López');
    expect(elemento.querySelector('form')).toBeNull();
  });

  it('una orden en cola se presenta como resultado, no como error', () => {
    crearOrden.execute.and.returnValue(
      of({ mensaje: 'Orden ORD-000006 en cola.', data: ORDEN_EN_COLA }),
    );

    enviarOrden();

    expect(elemento.querySelector('app-resultado-orden')?.textContent).toContain('Orden en cola');
    expect(elemento.querySelector('[role="alert"]')).toBeNull();
  });

  it('«Crear otra orden» vuelve a un formulario en blanco', () => {
    crearOrden.execute.and.returnValue(of({ mensaje: 'Creada.', data: ORDEN_ASIGNADA }));
    enviarOrden();

    (elemento.querySelector('app-resultado-orden button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const peso = elemento.querySelector('[formControlName="peso"]') as HTMLInputElement;
    expect(elemento.querySelector('app-resultado-orden')).toBeNull();
    expect(peso.value).toBe('');
  });

  it('bloquea el envío mientras espera la respuesta', () => {
    const respuesta = new Subject<ResultadoEscritura<Orden>>();
    crearOrden.execute.and.returnValue(respuesta);

    enviarOrden();

    const boton = elemento.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBeTrue();
  });

  it('si el servidor rechaza un campo muestra el aviso y el mensaje en ese campo', () => {
    crearOrden.execute.and.returnValue(
      throwError(
        () =>
          new ErrorAplicacion(
            'Algunos datos no son válidos. Revisa los campos marcados.',
            'VALIDACION.ENTRADA_INVALIDA',
            [{ campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' }],
          ),
      ),
    );

    enviarOrden();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'Algunos datos no son válidos.',
    );
    expect(elemento.querySelector('mat-error')?.textContent).toContain(
      'El peso debe ser mayor que 0 y no superar 50 kg.',
    );
    expect(
      (elemento.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBeFalse();
  });

  it('ante un fallo sin clasificar muestra un mensaje genérico y conserva lo escrito', () => {
    crearOrden.execute.and.returnValue(throwError(() => new Error('boom')));

    enviarOrden();

    const peso = elemento.querySelector('[formControlName="peso"]') as HTMLInputElement;
    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'Ocurrió un error inesperado.',
    );
    expect(peso.value).toBe('4.5');
  });
});
