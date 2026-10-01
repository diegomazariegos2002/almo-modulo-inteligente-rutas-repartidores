import { CerrarSesionUseCase } from '@auth/Application/cerrar-sesion.use-case';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { Usuario } from '@auth/Domain/usuario.entity';
import {
  crearSesionEnMemoria,
  USUARIO_ADMIN,
  USUARIO_CLIENTE,
  USUARIO_REPARTIDOR,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { ShellComponent } from './shell.component';

/** El marco real con una sesión en memoria del usuario indicado. */
const enSesionComo = (usuario: Usuario) =>
  applicationConfig({
    providers: [
      CerrarSesionUseCase,
      { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria(usuario) },
    ],
  });

const meta: Meta<ShellComponent> = {
  title: 'Shared/Shell',
  component: ShellComponent,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<ShellComponent>;

/** La navegación cambia con los permisos: el cliente crea órdenes y consulta las suyas. */
export const Cliente: Story = {
  decorators: [enSesionComo(USUARIO_CLIENTE)],
};

export const Repartidor: Story = {
  decorators: [enSesionComo(USUARIO_REPARTIDOR)],
};

export const Despacho: Story = {
  decorators: [enSesionComo(USUARIO_ADMIN)],
};

/** En pantallas angostas la navegación pasa a una barra inferior. */
export const EnMovil: Story = {
  decorators: [enSesionComo(USUARIO_REPARTIDOR)],
  globals: { viewport: { value: 'movil' } },
};
