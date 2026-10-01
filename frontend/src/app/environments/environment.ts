import { CUENTAS_DEMO } from './cuentas-demo';

// Entorno de desarrollo. La API se llama con rutas relativas: `ng serve` las reenvía
// al backend con proxy.conf.mjs.
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  cuentasDemo: CUENTAS_DEMO,
};
