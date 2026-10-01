import type { Meta, StoryObj } from '@storybook/angular';
import { RUTA_ANA, RUTA_CARLA, RUTA_LARGA } from '../_fixtures/repartidores.fixtures';
import { MapaRutaComponent } from './mapa-ruta.component';

const meta: Meta<MapaRutaComponent> = {
  title: 'Repartidores/MapaRuta',
  component: MapaRutaComponent,
  decorators: [
    (story) => {
      const { template, ...resto } = story();
      return { ...resto, template: `<div class="max-w-sm">${template}</div>` };
    },
  ],
};
export default meta;

type Story = StoryObj<MapaRutaComponent>;

export const UnaParada: Story = {
  args: { ruta: RUTA_CARLA },
};

export const DosParadas: Story = {
  args: { ruta: RUTA_ANA },
};

export const VariasParadas: Story = {
  args: { ruta: RUTA_LARGA },
};
