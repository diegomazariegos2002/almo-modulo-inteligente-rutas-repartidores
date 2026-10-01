import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DetalleValidacion } from '@shared/Domain/api.models';
import { LIMITES_ORDEN, NuevaOrden } from '../../../Domain/orden.models';
import { ZONAS_REFERENCIA, ZonaReferencia } from '../../../Domain/zona.models';

type CampoOrden = 'lat' | 'lng' | 'peso' | 'direccion';

const mayorQueCero: ValidatorFn = (control) =>
  typeof control.value === 'number' && control.value <= 0 ? { mayorQueCero: true } : null;

const FUERA_DE_RANGO_LAT = `La latitud debe estar entre ${LIMITES_ORDEN.latMin} y ${LIMITES_ORDEN.latMax}.`;
const FUERA_DE_RANGO_LNG = `La longitud debe estar entre ${LIMITES_ORDEN.lngMin} y ${LIMITES_ORDEN.lngMax}.`;

/** Mensaje por campo y por validador. La clave es el nombre del error de Angular. */
const MENSAJES: Record<CampoOrden, Record<string, string>> = {
  lat: {
    required: 'Ingresa la latitud como un número.',
    min: FUERA_DE_RANGO_LAT,
    max: FUERA_DE_RANGO_LAT,
  },
  lng: {
    required: 'Ingresa la longitud como un número.',
    min: FUERA_DE_RANGO_LNG,
    max: FUERA_DE_RANGO_LNG,
  },
  peso: {
    required: 'Ingresa el peso como un número.',
    mayorQueCero: 'El peso debe ser mayor que 0.',
    max: `El peso no puede superar ${LIMITES_ORDEN.pesoMaxKg} kg.`,
  },
  direccion: {
    maxlength: `La dirección no puede superar ${LIMITES_ORDEN.direccionMaxCaracteres} caracteres.`,
  },
};

/**
 * Formulario de creación de una orden. Valida en el cliente las mismas reglas que el
 * servidor y, si aun así el servidor rechaza un campo, muestra su mensaje en ese campo.
 */
@Component({
  selector: 'app-orden-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './orden-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenFormComponent {
  readonly enviando = input(false);
  /** Errores por campo devueltos por la API (`details`). */
  readonly erroresServidor = input<readonly DetalleValidacion[]>([]);

  readonly crear = output<NuevaOrden>();

  protected readonly zonas = ZONAS_REFERENCIA;
  protected readonly limites = LIMITES_ORDEN;

  protected readonly formulario = new FormGroup({
    // La zona solo ayuda a llenar los demás campos; no se envía al servidor.
    zona: new FormControl<ZonaReferencia | null>(null),
    lat: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(LIMITES_ORDEN.latMin),
      Validators.max(LIMITES_ORDEN.latMax),
    ]),
    lng: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(LIMITES_ORDEN.lngMin),
      Validators.max(LIMITES_ORDEN.lngMax),
    ]),
    peso: new FormControl<number | null>(null, [
      Validators.required,
      mayorQueCero,
      Validators.max(LIMITES_ORDEN.pesoMaxKg),
    ]),
    direccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(LIMITES_ORDEN.direccionMaxCaracteres)],
    }),
  });

  constructor() {
    // Elegir una zona llena las coordenadas y la dirección, que siguen siendo editables.
    this.formulario.controls.zona.valueChanges.pipe(takeUntilDestroyed()).subscribe((zona) => {
      if (zona) {
        this.formulario.patchValue({ lat: zona.lat, lng: zona.lng, direccion: zona.nombre });
      }
    });

    // El error del servidor se cuelga del control como un error más. Angular lo
    // descarta solo en cuanto el usuario corrige el valor y vuelve a validar.
    effect(() => {
      for (const { campo, mensaje } of this.erroresServidor()) {
        const control = this.formulario.get(campo);
        control?.setErrors({ servidor: mensaje });
        control?.markAsTouched();
      }
    });
  }

  /** Si el usuario retoca las coordenadas, la zona elegida deja de describirlas. */
  protected alEditarCoordenadas(): void {
    this.formulario.controls.zona.setValue(null);
  }

  protected mensajeDe(campo: CampoOrden): string {
    const errores = this.formulario.controls[campo].errors ?? {};
    const [clave] = Object.keys(errores);
    return clave === 'servidor' ? String(errores[clave]) : (MENSAJES[campo][clave] ?? '');
  }

  protected enviar(): void {
    const { lat, lng, peso, direccion } = this.formulario.getRawValue();
    if (this.formulario.invalid || lat === null || lng === null || peso === null) {
      this.formulario.markAllAsTouched();
      return;
    }

    const referencia = direccion.trim();
    this.crear.emit({ lat, lng, peso, ...(referencia ? { direccion: referencia } : {}) });
  }
}
