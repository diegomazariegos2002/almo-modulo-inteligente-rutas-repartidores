import type { Meta, StoryObj } from '@storybook/angular';
import { LogoComponent } from './logo.component';

const meta: Meta<LogoComponent> = {
  title: 'Shared/Logo',
  component: LogoComponent,
};
export default meta;

type Story = StoryObj<LogoComponent>;

export const PorDefecto: Story = {};
