import { ResultadoEscritura } from '@shared/Domain/api.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { delay, Observable, of, throwError } from 'rxjs';
import { CrearOrdenUseCase } from '../../../Application/crear-orden.use-case';
import { Orden } from '../../../Domain/orden.entity';
import { ORDENES_REPOSITORY } from '../../../Domain/ordenes.repository';
import { ORDEN_ASIGNADA, ORDEN_EN_COLA } from '../_fixtures/ordenes.fixtures';
import { NuevaOrdenPageComponent } from './nueva-orden-page.component';

/** La página real con un repositorio de mentira que responde lo que cada story necesita. */
const conRespuesta = (respuesta: Observable<ResultadoEscritura<Orden>>) =>
  applicationConfig({
    providers: [
      CrearOrdenUseCase,
      { provide: ORDENES_REPOSITORY, useValue: { crear: () => respuesta.pipe(delay(600)) } },
    ],
  });

const meta: Meta<NuevaOrdenPageComponent> = {
  title: 'Ordenes/NuevaOrdenPage',
  component: NuevaOrdenPageComponent,
};
export default meta;

type Story = StoryObj<NuevaOrdenPageComponent>;

/** Llena y envía el formulario: la orden queda asignada a un repartidor. */
export const OrdenAsignada: Story = {
  decorators: [
    conRespuesta(of({ mensaje: 'Orden ORD-000003 asignada a Ana López.', data: ORDEN_ASIGNADA })),
  ],
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(
      canvas.getByLabelText(/Zona de referencia/),
      'Zona 4 — Cuatro Grados Norte',
    );
    await userEvent.type(canvas.getByLabelText(/Peso/), '4.5');
    await userEvent.click(canvas.getByRole('button', { name: 'Crear orden' }));
  },
};

/** Nadie tiene capacidad: la orden queda en cola, que es un resultado correcto. */
export const OrdenEnCola: Story = {
  decorators: [
    conRespuesta(
      of({
        mensaje:
          'Orden ORD-000006 registrada. Queda en cola hasta que haya un repartidor disponible.',
        data: ORDEN_EN_COLA,
      }),
    ),
  ],
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Latitud/), '14.593');
    await userEvent.type(canvas.getByLabelText(/Longitud/), '-90.489');
    await userEvent.type(canvas.getByLabelText(/Peso/), '45');
    await userEvent.click(canvas.getByRole('button', { name: 'Crear orden' }));
  },
};

/** El servidor rechaza el peso: aviso general y mensaje en el campo. */
export const RechazoDelServidor: Story = {
  decorators: [
    conRespuesta(
      throwError(
        () =>
          new ErrorAplicacion(
            'Algunos datos no son válidos. Revisa los campos marcados.',
            'VALIDACION.ENTRADA_INVALIDA',
            [{ campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' }],
          ),
      ),
    ),
  ],
  play: OrdenAsignada.play,
};

export const EnMovil: Story = {
  decorators: [conRespuesta(of({ mensaje: 'Orden creada.', data: ORDEN_ASIGNADA }))],
  globals: { viewport: { value: 'movil' } },
};
