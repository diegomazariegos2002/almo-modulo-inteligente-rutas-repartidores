import type { Meta, StoryObj } from '@storybook/angular';
import { RUTA_ANA, RUTA_CARLA, RUTA_VACIA } from '../_fixtures/repartidores.fixtures';
import { ResumenRutaComponent } from './resumen-ruta.component';

const meta: Meta<ResumenRutaComponent> = {
  title: 'Repartidores/ResumenRuta',
  component: ResumenRutaComponent,
};
export default meta;

type Story = StoryObj<ResumenRutaComponent>;

export const Disponible: Story = {
  args: { ruta: RUTA_ANA },
};

export const EnRuta: Story = {
  args: { ruta: RUTA_CARLA },
};

export const SinParadas: Story = {
  args: { ruta: RUTA_VACIA },
};

export const EnMovil: Story = {
  args: { ruta: RUTA_ANA },
  globals: { viewport: { value: 'movil' } },
};
