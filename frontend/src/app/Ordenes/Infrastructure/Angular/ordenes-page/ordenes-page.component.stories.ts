import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import {
  crearSesionEnMemoria,
  USUARIO_CLIENTE,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { Pagina } from '@shared/Domain/api.models';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { delay, NEVER, Observable, of, throwError } from 'rxjs';
import { ListarOrdenesUseCase } from '../../../Application/listar-ordenes.use-case';
import { Orden } from '../../../Domain/orden.entity';
import { FiltroOrdenes } from '../../../Domain/orden.models';
import { ORDENES_REPOSITORY } from '../../../Domain/ordenes.repository';
import { ORDEN_EN_COLA, PAGINA_ORDENES } from '../_fixtures/ordenes.fixtures';
import { OrdenesPageComponent } from './ordenes-page.component';

type Listar = (filtro: FiltroOrdenes) => Observable<Pagina<Orden>>;

/** La página real con un repositorio de mentira: no hay backend en Storybook. */
const conRepositorio = (listar: Listar) =>
  applicationConfig({
    providers: [
      ListarOrdenesUseCase,
      { provide: ORDENES_REPOSITORY, useValue: { listar } },
      { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria(USUARIO_CLIENTE) },
    ],
  });

/** Filtra y pagina en memoria las órdenes del seed, como lo haría `GET /api/ordenes`. */
const listarEnMemoria: Listar = ({ estado, page, limit }) => {
  const todas = [ORDEN_EN_COLA, ...PAGINA_ORDENES.data];
  const filtradas = estado ? todas.filter((orden) => orden.estado === estado) : todas;
  const totalPages = Math.ceil(filtradas.length / limit);

  return of({
    data: filtradas.slice((page - 1) * limit, page * limit),
    meta: {
      total: filtradas.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }).pipe(delay(300));
};

const meta: Meta<OrdenesPageComponent> = {
  title: 'Ordenes/OrdenesPage',
  component: OrdenesPageComponent,
};
export default meta;

type Story = StoryObj<OrdenesPageComponent>;

/** Seis órdenes: prueba el filtro por estado, el tamaño de página y el historial. */
export const ConOrdenes: Story = {
  decorators: [conRepositorio(listarEnMemoria)],
};

export const Cargando: Story = {
  decorators: [conRepositorio(() => NEVER)],
};

export const SinOrdenes: Story = {
  decorators: [
    conRepositorio(({ page, limit }) =>
      of({
        data: [],
        meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      }),
    ),
  ],
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
  decorators: [conRepositorio(listarEnMemoria)],
  globals: { viewport: { value: 'movil' } },
};
