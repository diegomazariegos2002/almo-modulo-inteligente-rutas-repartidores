import { CUENTAS_DEMO } from './cuentas-demo';

// Entorno de producción (imagen Docker). La API sigue siendo relativa: nginx reenvía
// /api al backend.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  cuentasDemo: CUENTAS_DEMO,
};
