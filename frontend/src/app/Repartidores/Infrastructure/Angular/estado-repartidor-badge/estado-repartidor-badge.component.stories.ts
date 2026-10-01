import type { Meta, StoryObj } from '@storybook/angular';
import { EstadoRepartidorBadgeComponent } from './estado-repartidor-badge.component';

const meta: Meta<EstadoRepartidorBadgeComponent> = {
  title: 'Repartidores/EstadoRepartidorBadge',
  component: EstadoRepartidorBadgeComponent,
};
export default meta;

type Story = StoryObj<EstadoRepartidorBadgeComponent>;

export const Disponible: Story = {
  args: { estado: 'DISPONIBLE', descripcion: 'Disponible' },
};

export const EnRuta: Story = {
  args: { estado: 'EN_RUTA', descripcion: 'En ruta' },
};
