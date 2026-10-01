import type { Meta, StoryObj } from '@storybook/angular';
import { SpinnerComponent } from './spinner.component';

const meta: Meta<SpinnerComponent> = {
  title: 'Shared/Spinner',
  component: SpinnerComponent,
};
export default meta;

type Story = StoryObj<SpinnerComponent>;

export const PorDefecto: Story = {};

export const ConMensaje: Story = {
  args: { mensaje: 'Cargando órdenes…' },
};
