import type { Meta, StoryObj } from '@storybook/angular';
import { REPARTIDOR_ANA, REPARTIDOR_CARLA } from '../_fixtures/repartidores.fixtures';
import { RepartidorCardComponent } from './repartidor-card.component';

const meta: Meta<RepartidorCardComponent> = {
  title: 'Repartidores/RepartidorCard',
  component: RepartidorCardComponent,
  argTypes: {
    seleccionar: { action: 'seleccionar' },
  },
  decorators: [
    (story) => {
      const { template, ...resto } = story();
      return { ...resto, template: `<div class="max-w-sm">${template}</div>` };
    },
  ],
};
export default meta;

type Story = StoryObj<RepartidorCardComponent>;

export const Disponible: Story = {
  args: { repartidor: REPARTIDOR_ANA },
};

export const EnRuta: Story = {
  args: { repartidor: REPARTIDOR_CARLA },
};

export const Seleccionado: Story = {
  args: { repartidor: REPARTIDOR_ANA, seleccionado: true },
};
