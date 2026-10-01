import type { Meta, StoryObj } from '@storybook/angular';
import { FiltroEstadoComponent } from './filtro-estado.component';

const meta: Meta<FiltroEstadoComponent> = {
  title: 'Ordenes/FiltroEstado',
  component: FiltroEstadoComponent,
  argTypes: {
    estado: {
      control: 'select',
      options: [null, 'PENDIENTE_ASIGNACION', 'ASIGNADA', 'EN_RUTA', 'ENTREGADA'],
    },
    cambio: { action: 'cambio' },
  },
};
export default meta;

type Story = StoryObj<FiltroEstadoComponent>;

export const Todos: Story = {
  args: { estado: null },
};

export const FiltrandoAsignadas: Story = {
  args: { estado: 'ASIGNADA' },
};

export const Deshabilitado: Story = {
  args: { estado: 'EN_RUTA', deshabilitado: true },
};

export const EnMovil: Story = {
  args: { estado: 'PENDIENTE_ASIGNACION' },
  globals: { viewport: { value: 'movil' } },
};
