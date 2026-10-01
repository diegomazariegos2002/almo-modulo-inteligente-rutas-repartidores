import type { Meta, StoryObj } from '@storybook/angular';
import { AvisoComponent } from './aviso.component';

const meta: Meta<AvisoComponent> = {
  title: 'Shared/Aviso',
  component: AvisoComponent,
  argTypes: {
    tipo: { control: 'inline-radio', options: ['error', 'exito', 'info'] },
    accionado: { action: 'accionado' },
  },
};
export default meta;

type Story = StoryObj<AvisoComponent>;

export const Error: Story = {
  args: {
    tipo: 'error',
    mensaje: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  },
};

export const ErrorConReintento: Story = {
  args: { ...Error.args, accion: 'Reintentar' },
};

export const Exito: Story = {
  args: { tipo: 'exito', mensaje: 'Orden ORD-000006 asignada a Ana López.' },
};

export const Informacion: Story = {
  args: { tipo: 'info', mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' },
};
