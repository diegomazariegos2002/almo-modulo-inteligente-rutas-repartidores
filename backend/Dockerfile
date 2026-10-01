# =============================================================
# Imagen del backend (servicio "rutas", NestJS).
#
#   deps      instala todas las dependencias y genera el cliente Prisma
#   source    añade el código fuente
#   build     compila el servicio con Nx (dist/apps/rutas/main.js)
#   migrator  un solo uso: aplica las migraciones y siembra los datos de demostración
#   prod-deps instala solo las dependencias de producción
#   runtime   imagen final: Node + dependencias de producción + main.js
#
# El contexto de construcción es la carpeta backend/.
# =============================================================
ARG NODE_VERSION=22

# ── Base de las etapas de construcción ───────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV CI=true \
    NX_DAEMON=false
# El CLI de Prisma necesita OpenSSL para escoger su motor de migraciones.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g pnpm@10.33.0
WORKDIR /workspace

# ── Dependencias (capa cacheada mientras no cambie el lockfile) ─
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
# El postinstall genera el cliente Prisma: necesita la configuración y el esquema.
COPY libs/prisma/prisma.config.ts libs/prisma/prisma.config.ts
COPY libs/prisma/src/lib/schema libs/prisma/src/lib/schema
RUN pnpm install --frozen-lockfile

# ── Código fuente ────────────────────────────────────────────
FROM deps AS source
COPY . .

# ── Compilación ──────────────────────────────────────────────
FROM source AS build
RUN pnpm nx build rutas

# ── Migraciones + seed (contenedor de un solo uso) ───────────
# `migrate deploy` solo aplica lo pendiente y el seed no duplica datos:
# se puede ejecutar en cada arranque sin efectos secundarios.
FROM source AS migrator
CMD ["sh", "-c", "pnpm prisma:migrate:deploy && pnpm prisma:seed"]

# ── Dependencias de producción ───────────────────────────────
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
# Sin scripts: el postinstall usa el CLI de Prisma, que es una dependencia de desarrollo.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# ── Imagen final ─────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=prod-deps /workspace/node_modules ./node_modules
COPY --from=build /workspace/dist/apps/rutas ./
# Usuario sin privilegios que ya trae la imagen oficial de Node.
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "--enable-source-maps", "main.js"]
