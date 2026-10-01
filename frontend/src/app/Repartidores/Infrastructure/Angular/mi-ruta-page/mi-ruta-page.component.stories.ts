import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import {
  crearSesionEnMemoria,
  USUARIO_REPARTIDOR,
} from '@auth/Infrastructure/Angular/_fixtures/usuarios.fixtures';
import { CambiarEstadoOrdenUseCase } from '@ordenes/Application/cambiar-estado-orden.use-case';
import { EstadoDestino } from '@ordenes/Domain/orden.models';
import { ORDENES_REPOSITORY } from '@ordenes/Domain/ordenes.repository';
import { ORDEN_EN_RUTA } from '@ordenes/Infrastructure/Angular/_fixtures/ordenes.fixtures';
import { ErrorAplicacion } from '@shared/Domain/error-aplicacion.entity';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { delay, NEVER, Observable, of, throwError } from 'rxjs';
import { ObtenerRutaRepartidorUseCase } from '../../../Application/obtener-ruta-repartidor.use-case';
import { RepartidorPlain, RutaPlain } from '../../../Domain/repartidor.models';
import { REPARTIDORES_REPOSITORY } from '../../../Domain/repartidores.repository';
import { Ruta } from '../../../Domain/ruta.entity';
import {
  RUTA_ANA_PLAIN,
  RUTA_LARGA_PLAIN,
  RUTA_VACIA_PLAIN,
} from '../_fixtures/repartidores.fixtures';
import { MiRutaPageComponent } from './mi-ruta-page.component';

/** La página real, en sesión como repartidor, con repositorios de mentira. */
const conRepositorios = (
  obtenerRuta: () => Observable<Ruta>,
  cambiarEstado: (folio: string, estado: EstadoDestino) => Observable<unknown> = () => NEVER,
) =>
  applicationConfig({
    providers: [
      ObtenerRutaRepartidorUseCase,
      CambiarEstadoOrdenUseCase,
      { provide: REPARTIDORES_REPOSITORY, useValue: { obtenerRuta } },
      { provide: ORDENES_REPOSITORY, useValue: { cambiarEstado } },
      { provide: SESION_CONTRACT, useValue: crearSesionEnMemoria(USUARIO_REPARTIDOR) },
    ],
  });

/**
 * Simula en memoria lo que hace el servidor con cada acción, para recorrer el flujo
 * completo sin backend. Es una versión simplificada: al entregar una parada no
 * reoptimiza la ruta, solo la quita y vuelve a sumar las distancias.
 */
function conRutaSimulada(inicial: RutaPlain) {
  let ruta = inicial;

  return conRepositorios(
    () => of(Ruta.fromPlain(ruta)).pipe(delay(300)),
    (folio, estado) => {
      if (estado === 'EN_RUTA') {
        ruta = {
          ...ruta,
          repartidor: { ...ruta.repartidor, estado: 'EN_RUTA', estadoDescripcion: 'En ruta' },
          paradas: ruta.paradas.map((parada) => ({
            ...parada,
            estado: 'EN_RUTA',
            estadoDescripcion: 'En Ruta',
          })),
        };
        return of({ mensaje: `${ruta.repartidor.nombre} salió a ruta.`, data: ORDEN_EN_RUTA }).pipe(
          delay(500),
        );
      }

      let acumulada = 0;
      const pendientes = ruta.paradas
        .filter((parada) => parada.folio !== folio)
        .map((parada, indice) => {
          acumulada += parada.distanciaDesdeAnteriorKm;
          return { ...parada, secuencia: indice + 1, distanciaAcumuladaKm: acumulada };
        });
      const repartidor: RepartidorPlain = {
        ...ruta.repartidor,
        cargaKg: pendientes.reduce((carga, parada) => carga + parada.peso, 0),
      };
      if (pendientes.length === 0) {
        // Al entregar la última parada el repartidor vuelve a estar disponible.
        repartidor.estado = 'DISPONIBLE';
        repartidor.estadoDescripcion = 'Disponible';
      }
      ruta = {
        ...ruta,
        repartidor,
        paradas: pendientes,
        totalParadas: pendientes.length,
        distanciaTotalKm: acumulada,
      };
      return of({ mensaje: `Orden ${folio} entregada.`, data: ORDEN_EN_RUTA }).pipe(delay(500));
    },
  );
}

const meta: Meta<MiRutaPageComponent> = {
  title: 'Repartidores/MiRutaPage',
  component: MiRutaPageComponent,
};
export default meta;

type Story = StoryObj<MiRutaPageComponent>;

/** Flujo completo: pulsa «Iniciar ruta» y después marca cada parada como entregada. */
export const ListaParaSalir: Story = {
  decorators: [conRutaSimulada(RUTA_ANA_PLAIN)],
};

export const EnRuta: Story = {
  decorators: [conRutaSimulada(RUTA_LARGA_PLAIN)],
};

export const SinParadas: Story = {
  decorators: [conRutaSimulada(RUTA_VACIA_PLAIN)],
};

export const Cargando: Story = {
  decorators: [conRepositorios(() => NEVER)],
};

export const ErrorDeConexion: Story = {
  decorators: [
    conRepositorios(() =>
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
  decorators: [conRutaSimulada(RUTA_LARGA_PLAIN)],
  globals: { viewport: { value: 'movil' } },
};
