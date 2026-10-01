import type { Meta, StoryObj } from '@storybook/angular';
import { RUTA_ANA, RUTA_LARGA, RUTA_VACIA } from '../_fixtures/repartidores.fixtures';
import { RutaDetalleComponent } from './ruta-detalle.component';

const meta: Meta<RutaDetalleComponent> = {
  title: 'Repartidores/RutaDetalle',
  component: RutaDetalleComponent,
  argTypes: {
    iniciar: { action: 'iniciar' },
    entregar: { action: 'entregar' },
  },
};
export default meta;

type Story = StoryObj<RutaDetalleComponent>;

/** El repartidor aún no sale: la única acción disponible es iniciar la ruta. */
export const ListaParaSalir: Story = {
  args: { ruta: RUTA_ANA },
};

export const IniciandoRuta: Story = {
  args: { ruta: RUTA_ANA, ocupada: true, iniciando: true },
};

/** Ya en ruta: cada parada se puede marcar como entregada. */
export const EnRuta: Story = {
  args: { ruta: RUTA_LARGA },
};

export const SinParadas: Story = {
  args: { ruta: RUTA_VACIA },
};

/** Lo que ve despacho: la misma ruta sin acciones. */
export const SoloLectura: Story = {
  args: { ruta: RUTA_LARGA, soloLectura: true },
};

export const EnMovil: Story = {
  args: { ruta: RUTA_LARGA },
  globals: { viewport: { value: 'movil' } },
};
