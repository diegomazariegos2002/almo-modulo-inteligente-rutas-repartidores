import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Shared/Badge',
  component: BadgeComponent,
  argTypes: {
    tono: { control: 'select', options: ['neutro', 'info', 'progreso', 'exito', 'alerta'] },
  },
};
export default meta;

type Story = StoryObj<BadgeComponent>;

export const Neutro: Story = {
  args: { etiqueta: 'Sin clasificar', tono: 'neutro' },
};

export const Info: Story = {
  args: { etiqueta: 'Asignada', tono: 'info', icono: 'assignment_ind' },
};

export const Progreso: Story = {
  args: { etiqueta: 'En Ruta', tono: 'progreso', icono: 'local_shipping' },
};

export const Exito: Story = {
  args: { etiqueta: 'Entregada', tono: 'exito', icono: 'check_circle' },
};

export const Alerta: Story = {
  args: { etiqueta: 'Pendiente de Asignación', tono: 'alerta', icono: 'schedule' },
};
