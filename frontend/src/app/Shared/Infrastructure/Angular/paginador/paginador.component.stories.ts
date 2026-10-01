import type { Meta, StoryObj } from '@storybook/angular';
import { PaginadorComponent } from './paginador.component';

const meta: Meta<PaginadorComponent> = {
  title: 'Shared/Paginador',
  component: PaginadorComponent,
  argTypes: {
    cambioPagina: { action: 'cambioPagina' },
    cambioLimite: { action: 'cambioLimite' },
  },
};
export default meta;

type Story = StoryObj<PaginadorComponent>;

export const PrimeraPagina: Story = {
  args: {
    meta: {
      total: 12,
      page: 1,
      limit: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  },
};

export const PaginaIntermedia: Story = {
  args: {
    meta: { total: 12, page: 2, limit: 5, totalPages: 3, hasNextPage: true, hasPreviousPage: true },
  },
};

export const UltimaPagina: Story = {
  args: {
    meta: {
      total: 12,
      page: 3,
      limit: 5,
      totalPages: 3,
      hasNextPage: false,
      hasPreviousPage: true,
    },
  },
};

export const PaginaUnica: Story = {
  args: {
    meta: {
      total: 5,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
};

export const Deshabilitado: Story = {
  args: { ...PaginaIntermedia.args, deshabilitado: true },
};
