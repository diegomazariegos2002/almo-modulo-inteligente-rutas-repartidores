import type { Meta, StoryObj } from '@storybook/angular';
import { Repartidor } from '../../../Domain/repartidor.entity';
import { REPARTIDOR_ANA, REPARTIDORES_PLAIN } from '../_fixtures/repartidores.fixtures';
import { BarraCargaComponent } from './barra-carga.component';

const meta: Meta<BarraCargaComponent> = {
  title: 'Repartidores/BarraCarga',
  component: BarraCargaComponent,
  decorators: [
    (story) => {
      const { template, ...resto } = story();
      return { ...resto, template: `<div class="max-w-xs">${template}</div>` };
    },
  ],
};
export default meta;

type Story = StoryObj<BarraCargaComponent>;

export const CargaBaja: Story = {
  args: { repartidor: REPARTIDOR_ANA },
};

export const SinCarga: Story = {
  args: { repartidor: Repartidor.fromPlain({ ...REPARTIDORES_PLAIN[0], cargaKg: 0 }) },
};

export const AlLimite: Story = {
  args: { repartidor: Repartidor.fromPlain({ ...REPARTIDORES_PLAIN[0], cargaKg: 50 }) },
};
