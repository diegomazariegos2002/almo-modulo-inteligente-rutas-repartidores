import { killPort } from '@nx/node/utils';
import { entorno } from './entorno';

module.exports = async function globalTeardown(): Promise<void> {
  // Detiene el servicio que `nx run rutas-e2e:e2e` levantó para las pruebas.
  await killPort(entorno.port);
};
