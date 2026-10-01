import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Carga el .env de la raíz del workspace sin importar desde dónde se invoque el CLI.
config({ path: path.join(__dirname, '..', '..', '.env') });

const schemaDir = path.join(__dirname, 'src', 'lib', 'schema');

export default defineConfig({
  schema: schemaDir,
  migrations: {
    path: path.join(schemaDir, 'migrations'),
    seed: 'ts-node -r tsconfig-paths/register -P libs/prisma/tsconfig.lib.json libs/prisma/src/lib/seed/seed.ts',
  },
  datasource: {
    // `prisma generate` no necesita conexión; los comandos de migración sí.
    url: process.env['DATABASE_URL'] ?? '',
  },
});
