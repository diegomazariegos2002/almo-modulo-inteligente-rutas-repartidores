import type { Meta, StoryObj } from '@storybook/angular';
import { PaginaEstadoComponent } from './pagina-estado.component';

const meta: Meta<PaginaEstadoComponent> = {
  title: 'Shared/PaginaEstado',
  component: PaginaEstadoComponent,
};
export default meta;

type Story = StoryObj<PaginaEstadoComponent>;

export const SinPermiso: Story = {
  args: {
    codigo: 403,
    titulo: 'No tienes acceso a esta sección',
    descripcion: 'Tu usuario no tiene permiso para ver esta pantalla.',
  },
};

export const NoEncontrada: Story = {
  args: {
    codigo: 404,
    titulo: 'No encontramos esta página',
    descripcion: 'La dirección no existe o cambió de lugar.',
  },
};
