import { waitForPortOpen } from '@nx/node/utils';
import { entorno } from './entorno';

module.exports = async function globalSetup(): Promise<void> {
  // Estas pruebas BORRAN y vuelven a sembrar la base local: hay que pedirlo explícitamente.
  if (process.env['E2E_CONFIRM_TRUNCATE'] !== 'true') {
    throw new Error(
      'Las pruebas e2e reinician los datos de la base configurada en DATABASE_URL.\n' +
        'Para ejecutarlas, define E2E_CONFIRM_TRUNCATE=true (no lo hagas contra una base con datos que importen).',
    );
  }

  console.log(`\nEsperando al servicio en ${entorno.host}:${entorno.port}...\n`);
  await waitForPortOpen(entorno.port, { host: entorno.host });
};
