# =============================================================
# Imagen del frontend (Angular).
#
#   build    compila la aplicación en modo producción
#   runtime  nginx sin privilegios: sirve la SPA y reenvía /api al backend
#
# El contexto de construcción es la carpeta frontend/.
# =============================================================
ARG NODE_VERSION=22

# ── Compilación ──────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS build
ENV CI=true
RUN npm install -g pnpm@10.33.0
WORKDIR /workspace
# Capa cacheada mientras no cambie el lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── Imagen final ─────────────────────────────────────────────
# Variante oficial de nginx que no corre como root y escucha en el puerto 8080.
FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime
# A dónde se reenvía /api. En docker compose, "backend" es el nombre del servicio.
ENV BACKEND_URL=http://backend:3000
# envsubst solo sustituye esa variable: las de nginx ($uri, $host…) quedan intactas.
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist/rutas-frontend/browser /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD ["wget", "-q", "--spider", "http://127.0.0.1:8080/healthz"]
