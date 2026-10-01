import type { Meta, StoryObj } from '@storybook/angular';
import { ORDEN_ASIGNADA, ORDEN_EN_COLA } from '../_fixtures/ordenes.fixtures';
import { ResultadoOrdenComponent } from './resultado-orden.component';

const meta: Meta<ResultadoOrdenComponent> = {
  title: 'Ordenes/ResultadoOrden',
  component: ResultadoOrdenComponent,
  argTypes: {
    crearOtra: { action: 'crearOtra' },
  },
};
export default meta;

type Story = StoryObj<ResultadoOrdenComponent>;

export const Asignada: Story = {
  args: {
    resultado: { mensaje: 'Orden ORD-000003 asignada a Ana López.', data: ORDEN_ASIGNADA },
  },
};

/** No había repartidor con capacidad: la orden queda en cola y no es un error. */
export const EnCola: Story = {
  args: {
    resultado: {
      mensaje:
        'Orden ORD-000006 registrada. Queda en cola hasta que haya un repartidor disponible.',
      data: ORDEN_EN_COLA,
    },
  },
};

export const EnMovil: Story = {
  args: Asignada.args,
  globals: { viewport: { value: 'movil' } },
};
