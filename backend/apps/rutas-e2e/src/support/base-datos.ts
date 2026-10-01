import { crearClienteSeed, reiniciarRutas } from '@almo/prisma/seed';
import { Redis } from 'ioredis';
import { entorno } from './entorno';

const prisma = crearClienteSeed(entorno.databaseUrl);
const redis = new Redis({ ...entorno.redis, lazyConnect: true, maxRetriesPerRequest: 1 });

/**
 * Deja la base y el caché como recién sembrados (DESTRUCTIVO).
 * Estado inicial conocido:
 *   Repartidor 1 Ana    DISPONIBLE  Zona 1   50 kg  → ORD-000003, ORD-000004 (ASIGNADA)
 *   Repartidor 2 Bruno  DISPONIBLE  Zona 10  60 kg  → ORD-000005 (ASIGNADA)
 *   Repartidor 3 Carla  EN_RUTA     Zona 11  40 kg  → ORD-000002 (EN_RUTA); ORD-000001 ENTREGADA
 */
export async function reiniciarDatos(): Promise<void> {
  await reiniciarRutas(prisma);

  // La base cambió por fuera del servicio: las rutas en caché ya no valen.
  if (redis.status === 'wait') await redis.connect();
  const claves = await redis.keys('rutas:ruta:repartidor:*');
  if (claves.length > 0) await redis.del(...claves);
}

export async function cerrarConexiones(): Promise<void> {
  await prisma.$disconnect();
  await redis.quit().catch(() => undefined);
}
