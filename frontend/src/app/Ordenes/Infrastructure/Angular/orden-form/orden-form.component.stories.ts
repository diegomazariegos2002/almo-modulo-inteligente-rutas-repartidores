import type { Meta, StoryObj } from '@storybook/angular';
import { OrdenFormComponent } from './orden-form.component';

const meta: Meta<OrdenFormComponent> = {
  title: 'Ordenes/OrdenForm',
  component: OrdenFormComponent,
  argTypes: {
    crear: { action: 'crear' },
  },
  decorators: [
    (story) => {
      const { template, ...resto } = story();
      return { ...resto, template: `<div class="max-w-xl">${template}</div>` };
    },
  ],
};
export default meta;

type Story = StoryObj<OrdenFormComponent>;

export const Vacio: Story = {};

/** Elige una zona y completa el peso: el formulario queda listo para enviarse. */
export const LlenoDesdeUnaZona: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(
      canvas.getByLabelText(/Zona de referencia/),
      'Zona 4 — Cuatro Grados Norte',
    );
    await userEvent.type(canvas.getByLabelText(/Peso/), '4.5');
  },
};

/** Valores fuera de rango: cada campo muestra su propio mensaje al intentar enviar. */
export const ConErroresDeValidacion: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Latitud/), '120');
    await userEvent.type(canvas.getByLabelText(/Peso/), '0');
    await userEvent.click(canvas.getByRole('button', { name: 'Crear orden' }));
  },
};

/** El servidor rechazó un campo: su mensaje (`details`) aparece en ese campo. */
export const ConErroresDelServidor: Story = {
  args: {
    erroresServidor: [
      { campo: 'peso', mensaje: 'El peso debe ser mayor que 0 y no superar 50 kg.' },
    ],
  },
};

export const Enviando: Story = {
  args: { enviando: true },
};

export const EnMovil: Story = {
  globals: { viewport: { value: 'movil' } },
};
