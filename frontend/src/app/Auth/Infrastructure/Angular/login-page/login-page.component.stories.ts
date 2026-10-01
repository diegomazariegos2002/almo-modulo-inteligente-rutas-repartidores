import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { delay, Observable, of, throwError } from 'rxjs';
import { SESION_CONTRACT } from '../../../Application/contracts/sesion.contract';
import { IniciarSesionUseCase } from '../../../Application/iniciar-sesion.use-case';
import { AUTH_REPOSITORY } from '../../../Domain/auth.repository';
import { Sesion } from '../../../Domain/sesion.entity';
import { crearSesion, crearSesionEnMemoria, USUARIO_CLIENTE } from '../_fixtures/usuarios.fixtures';
import { LoginPageComponent } from './login-page.component';

/** La página real con un repositorio de mentira que acepta o rechaza el inicio de sesión. */
const conRespuesta = (respuesta: Observable<Sesion>) =>
  applicationConfig({
    providers: [
      IniciarSesionUseCase,
      { provide: AUTH_REPOSITORY, useValue: { iniciarSesion: () => respuesta.pipe(delay(600)) } },
      { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria() },
    ],
  });

const meta: Meta<LoginPageComponent> = {
  title: 'Auth/LoginPage',
  component: LoginPageComponent,
  parameters: { layout: 'fullscreen' },
  decorators: [conRespuesta(of(crearSesion(USUARIO_CLIENTE)))],
};
export default meta;

type Story = StoryObj<LoginPageComponent>;

/** Elige una cuenta de demostración para llenar el formulario. */
export const PorDefecto: Story = {};

export const CredencialesInvalidas: Story = {
  decorators: [
    conRespuesta(
      throwError(
        () =>
          new ErrorAplicacion(
            'El correo o la contraseña no son correctos.',
            'AUTH.CREDENCIALES_INVALIDAS',
          ),
      ),
    ),
  ],
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Correo/), 'cliente@almo.test');
    await userEvent.type(canvas.getByLabelText(/Contraseña/), 'incorrecta');
    await userEvent.click(canvas.getByRole('button', { name: 'Ingresar' }));
  },
};

/** Así llega quien tenía una sesión que venció. */
export const SesionExpirada: Story = {
  args: { sesion: 'expirada' },
};

export const EnMovil: Story = {
  globals: { viewport: { value: 'movil' } },
};
