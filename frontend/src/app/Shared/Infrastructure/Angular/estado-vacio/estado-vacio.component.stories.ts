import type { Meta, StoryObj } from '@storybook/angular';
import { EstadoVacioComponent } from './estado-vacio.component';

const meta: Meta<EstadoVacioComponent> = {
  title: 'Shared/EstadoVacio',
  component: EstadoVacioComponent,
};
export default meta;

type Story = StoryObj<EstadoVacioComponent>;

export const SinResultados: Story = {
  args: {
    icono: 'inbox',
    titulo: 'No hay órdenes',
    descripcion: 'Cuando se cree una orden aparecerá en este listado.',
  },
};

export const SoloTitulo: Story = {
  args: { icono: 'route', titulo: 'Sin paradas pendientes' },
};

export const ConAccion: Story = {
  args: {
    icono: 'filter_alt_off',
    titulo: 'Ninguna orden coincide con el filtro',
    descripcion: 'Prueba con otro estado o muestra todas las órdenes.',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-estado-vacio [icono]="icono" [titulo]="titulo" [descripcion]="descripcion">
        <button type="button" class="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium">
          Ver todas
        </button>
      </app-estado-vacio>
    `,
  }),
};
