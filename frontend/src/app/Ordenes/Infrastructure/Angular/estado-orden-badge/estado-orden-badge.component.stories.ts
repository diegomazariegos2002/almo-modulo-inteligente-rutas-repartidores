import type { Meta, StoryObj } from '@storybook/angular';
import { EstadoOrdenBadgeComponent } from './estado-orden-badge.component';

const meta: Meta<EstadoOrdenBadgeComponent> = {
  title: 'Ordenes/EstadoOrdenBadge',
  component: EstadoOrdenBadgeComponent,
};
export default meta;

type Story = StoryObj<EstadoOrdenBadgeComponent>;

export const PendienteDeAsignacion: Story = {
  args: { estado: 'PENDIENTE_ASIGNACION', descripcion: 'Pendiente de Asignación' },
};

export const Asignada: Story = {
  args: { estado: 'ASIGNADA', descripcion: 'Asignada' },
};

export const EnRuta: Story = {
  args: { estado: 'EN_RUTA', descripcion: 'En Ruta' },
};

export const Entregada: Story = {
  args: { estado: 'ENTREGADA', descripcion: 'Entregada' },
};
