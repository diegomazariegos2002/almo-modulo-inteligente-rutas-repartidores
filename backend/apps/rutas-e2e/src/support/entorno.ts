import { resolve } from 'node:path';
import { config } from 'dotenv';

// El servicio bajo prueba lee el .env de la raíz del workspace: las pruebas leen el mismo.
config({ path: resolve(process.cwd(), '.env'), quiet: true });

export const entorno = {
  host: process.env['HOST'] ?? 'localhost',
  port: Number(process.env['PORT'] ?? 3000),
  databaseUrl: process.env['DATABASE_URL'] ?? '',
  redis: {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: Number(process.env['REDIS_PORT'] ?? 6379),
    password: process.env['REDIS_PASSWORD'] || undefined,
  },
};

export const baseUrl = `http://${entorno.host}:${entorno.port}`;
