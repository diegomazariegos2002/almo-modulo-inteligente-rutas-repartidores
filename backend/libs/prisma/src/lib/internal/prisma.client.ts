import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';

/** Construye el cliente sobre el driver `pg` (Prisma 7 trabaja con adaptadores de driver). */
export function buildClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}
