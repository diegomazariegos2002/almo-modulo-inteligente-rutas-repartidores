import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';
import { seedRutas } from './templates/rutas.seed';

export { PASSWORD_DEMO, reiniciarRutas, seedRutas } from './templates/rutas.seed';

/** Sembradores disponibles, por esquema. */
export const SEEDERS: Record<string, (prisma: PrismaClient) => Promise<void>> = {
  rutas: seedRutas,
};

/** Cliente Prisma independiente de NestJS, para scripts (seed) y pruebas e2e. */
export function crearClienteSeed(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
