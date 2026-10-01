import type { Meta, StoryObj } from '@storybook/angular';
import { CUENTAS_DEMO } from '../_fixtures/usuarios.fixtures';
import { LoginFormComponent } from './login-form.component';

const meta: Meta<LoginFormComponent> = {
  title: 'Auth/LoginForm',
  component: LoginFormComponent,
  args: { cuentasDemo: CUENTAS_DEMO },
  argTypes: {
    ingresar: { action: 'ingresar' },
  },
  decorators: [
    (story) => {
      const { template, ...resto } = story();
      return { ...resto, template: `<div class="max-w-md">${template}</div>` };
    },
  ],
};
export default meta;

type Story = StoryObj<LoginFormComponent>;

export const Vacio: Story = {};

/** Al elegir una cuenta de demostración se llenan el correo y la contraseña. */
export const ConCuentaElegida: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Ana López/ }));
  },
};

export const ConErroresDeValidacion: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Correo/), 'cliente');
    await userEvent.click(canvas.getByRole('button', { name: 'Ingresar' }));
  },
};

export const CredencialesInvalidas: Story = {
  args: { error: 'El correo o la contraseña no son correctos.' },
};

export const Enviando: Story = {
  args: { enviando: true },
};

export const SinCuentasDemo: Story = {
  args: { cuentasDemo: [] },
};
