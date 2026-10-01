import type { Meta, StoryObj } from '@storybook/angular';
import { RUTA_ANA, RUTA_CARLA, RUTA_LARGA } from '../_fixtures/repartidores.fixtures';
import { ListaParadasComponent } from './lista-paradas.component';

const meta: Meta<ListaParadasComponent> = {
  title: 'Repartidores/ListaParadas',
  component: ListaParadasComponent,
  argTypes: {
    entregar: { action: 'entregar' },
  },
  decorators: [
    (story) => {
      const { template, ...resto } = story();
      return { ...resto, template: `<div class="max-w-xl">${template}</div>` };
    },
  ],
};
export default meta;

type Story = StoryObj<ListaParadasComponent>;

export const Vacia: Story = {
  args: { paradas: [] },
};

export const UnaParada: Story = {
  args: { paradas: RUTA_CARLA.paradas },
};

/** La ruta aún no sale: las paradas están asignadas y todavía no se pueden entregar. */
export const AntesDeSalir: Story = {
  args: { paradas: RUTA_ANA.paradas },
};

export const VariasParadas: Story = {
  args: { paradas: RUTA_LARGA.paradas },
};

/** Se está entregando la segunda parada: las demás quedan bloqueadas mientras tanto. */
export const EntregandoUnaParada: Story = {
  args: { paradas: RUTA_LARGA.paradas, ocupada: true, folioEnCurso: 'ORD-000007' },
};

export const SoloLectura: Story = {
  args: { paradas: RUTA_LARGA.paradas, soloLectura: true },
};

export const EnMovil: Story = {
  args: { paradas: RUTA_LARGA.paradas },
  globals: { viewport: { value: 'movil' } },
};
