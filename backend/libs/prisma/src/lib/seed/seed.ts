/**
 * Seed de la base de datos.
 *
 *   pnpm prisma:seed            → siembra todos los esquemas
 *   pnpm prisma:seed rutas      → solo el esquema indicado
 *
 * Es idempotente: si la base ya tiene datos no los duplica.
 */
import * as path from 'node:path';
import { config } from 'dotenv';
import { crearClienteSeed, SEEDERS } from './index';

config({ path: path.join(__dirname, '..', '..', '..', '..', '..', '.env'), quiet: true });

async function main(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('Falta DATABASE_URL: defínela en .env o expórtala.');

  const prisma = crearClienteSeed(connectionString);
  const pedidos = process.argv.slice(2);
  const esquemas = pedidos.length > 0 ? pedidos : Object.keys(SEEDERS);

  try {
    for (const esquema of esquemas) {
      const seeder = SEEDERS[esquema];
      if (!seeder) {
        console.warn(`  No existe un seed para "${esquema}". Disponibles: ${Object.keys(SEEDERS).join(', ')}`);
        continue;
      }
      console.log(`Sembrando "${esquema}"...`);
      await seeder(prisma);
    }
    console.log('Seed completado.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('El seed falló:', error);
  process.exit(1);
});
