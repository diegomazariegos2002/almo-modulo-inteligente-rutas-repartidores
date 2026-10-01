import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { delay, Observable, of, throwError } from 'rxjs';
import { ListarRepartidoresUseCase } from '../../../Application/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from '../../../Application/obtener-ruta-repartidor.use-case';
import { Repartidor } from '../../../Domain/repartidor.entity';
import { REPARTIDORES_REPOSITORY } from '../../../Domain/repartidores.repository';
import { Ruta } from '../../../Domain/ruta.entity';
import { REPARTIDORES, RUTA_ANA, RUTA_BRUNO, RUTA_CARLA } from '../_fixtures/repartidores.fixtures';
import { DespachoPageComponent } from './despacho-page.component';

const RUTAS: Record<number, Ruta> = { 1: RUTA_ANA, 2: RUTA_BRUNO, 3: RUTA_CARLA };

/** La página real con un repositorio de mentira que devuelve el seed. */
const conRepositorio = (listar: () => Observable<Repartidor[]>) =>
  applicationConfig({
    providers: [
      ListarRepartidoresUseCase,
      ObtenerRutaRepartidorUseCase,
      {
        provide: REPARTIDORES_REPOSITORY,
        useValue: { listar, obtenerRuta: (id: number) => of(RUTAS[id]).pipe(delay(300)) },
      },
    ],
  });

const meta: Meta<DespachoPageComponent> = {
  title: 'Repartidores/DespachoPage',
  component: DespachoPageComponent,
};
export default meta;

type Story = StoryObj<DespachoPageComponent>;

/** Los tres repartidores del seed. Pulsa «Ver ruta» en cualquiera. */
export const ConRepartidores: Story = {
  decorators: [conRepositorio(() => of(REPARTIDORES))],
};

/** Con Carla elegida: su ruta en curso, sin acciones porque despacho solo consulta. */
export const ConRutaElegida: Story = {
  decorators: [conRepositorio(() => of(REPARTIDORES))],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /Carla Méndez/ }));
  },
};

export const ErrorDeConexion: Story = {
  decorators: [
    conRepositorio(() =>
      throwError(
        () =>
          new ErrorAplicacion(
            'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
            'SIN_CONEXION',
          ),
      ),
    ),
  ],
};

export const EnMovil: Story = {
  decorators: [conRepositorio(() => of(REPARTIDORES))],
  globals: { viewport: { value: 'movil' } },
};
