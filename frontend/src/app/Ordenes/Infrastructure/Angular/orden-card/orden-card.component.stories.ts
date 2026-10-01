import type { Meta, StoryObj } from '@storybook/angular';
import {
  ORDEN_ASIGNADA,
  ORDEN_EN_COLA,
  ORDEN_EN_RUTA,
  ORDEN_ENTREGADA,
} from '../_fixtures/ordenes.fixtures';
import { OrdenCardComponent } from './orden-card.component';

const meta: Meta<OrdenCardComponent> = {
  title: 'Ordenes/OrdenCard',
  component: OrdenCardComponent,
};
export default meta;

type Story = StoryObj<OrdenCardComponent>;

export const Asignada: Story = {
  args: { orden: ORDEN_ASIGNADA },
};

/** Sin repartidor ni dirección: el destino se muestra como coordenadas. */
export const EnCola: Story = {
  args: { orden: ORDEN_EN_COLA },
};

export const EnRuta: Story = {
  args: { orden: ORDEN_EN_RUTA },
};

export const EntregadaConHistorial: Story = {
  args: { orden: ORDEN_ENTREGADA, expandida: true },
};

export const EnMovil: Story = {
  args: { orden: ORDEN_ASIGNADA, expandida: true },
  globals: { viewport: { value: 'movil' } },
};
