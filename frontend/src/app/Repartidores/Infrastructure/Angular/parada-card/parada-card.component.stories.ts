import type { Meta, StoryObj } from '@storybook/angular';
import { RUTA_ANA, RUTA_CARLA, RUTA_LARGA } from '../_fixtures/repartidores.fixtures';
import { ParadaCardComponent } from './parada-card.component';

const meta: Meta<ParadaCardComponent> = {
  title: 'Repartidores/ParadaCard',
  component: ParadaCardComponent,
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

type Story = StoryObj<ParadaCardComponent>;

/** Primera parada de una ruta que aún no sale: la distancia se mide desde el repartidor. */
export const PrimeraParada: Story = {
  args: { parada: RUTA_ANA.paradas[0], primera: true },
};

export const ParadaSiguiente: Story = {
  args: { parada: RUTA_ANA.paradas[1] },
};

/** Ya en ruta: aparece la acción para marcar la entrega. */
export const EnRuta: Story = {
  args: { parada: RUTA_CARLA.paradas[0], primera: true },
};

/** Sin dirección de referencia: el destino se muestra como coordenadas. */
export const SinDireccion: Story = {
  args: { parada: RUTA_LARGA.paradas[2] },
};

/** Otra acción está en curso: el botón queda deshabilitado. */
export const AccionDeshabilitada: Story = {
  args: { parada: RUTA_CARLA.paradas[0], primera: true, ocupada: true },
};

export const Entregando: Story = {
  args: { parada: RUTA_CARLA.paradas[0], primera: true, enviando: true },
};

/** Vista de despacho: misma parada, sin acciones. */
export const SoloLectura: Story = {
  args: { parada: RUTA_CARLA.paradas[0], primera: true, soloLectura: true },
};
