import type { Meta, StoryObj } from '@storybook/angular';
import { ORDEN_EN_COLA, ORDEN_EN_RUTA, ORDEN_ENTREGADA } from '../_fixtures/ordenes.fixtures';
import { HistorialTimelineComponent } from './historial-timeline.component';

const meta: Meta<HistorialTimelineComponent> = {
  title: 'Ordenes/HistorialTimeline',
  component: HistorialTimelineComponent,
};
export default meta;

type Story = StoryObj<HistorialTimelineComponent>;

export const RecienCreada: Story = {
  args: { historial: ORDEN_EN_COLA.historial },
};

export const EnRuta: Story = {
  args: { historial: ORDEN_EN_RUTA.historial },
};

export const CicloCompleto: Story = {
  args: { historial: ORDEN_ENTREGADA.historial },
};
