# Rutas — backend

API del módulo de asignación inteligente de rutas para repartidores. El contrato HTTP está en
[`docs/contrato-api.md`](../docs/contrato-api.md) y la visión general del sistema, en el
[README de la raíz](../README.md).

**Stack:** NestJS 11, Prisma 7, PostgreSQL 16, Redis 7, Jest; monorepo Nx con pnpm.

## Puesta en marcha

Requisitos: Node 22, pnpm 10 y Docker (para PostgreSQL y Redis).

```bash
cp .env.example .env
pnpm install                  # también genera el cliente de Prisma
pnpm docker:dev               # PostgreSQL en :5434 y Redis en :6380
pnpm prisma:migrate:deploy
pnpm prisma:seed              # 3 repartidores, 5 órdenes y las cuentas de demostración
pnpm start                    # http://localhost:3000/api · Swagger en /api/docs
```

## Comandos

| Comando                      | Qué hace                                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| `pnpm start`                 | Servicio en modo desarrollo, con recarga                          |
| `pnpm build`                 | Compila a `dist/apps/rutas`                                       |
| `pnpm test`                  | Pruebas unitarias y de integración HTTP (sin base de datos)       |
| `pnpm test:coverage`         | Lo mismo, con cobertura y umbrales                                |
| `pnpm e2e`                   | Pruebas e2e contra PostgreSQL y Redis reales. **Vacía la base**: exige `E2E_CONFIRM_TRUNCATE=true` |
| `pnpm lint`                  | ESLint, incluidas las reglas de capas                             |
| `pnpm format:check`          | Prettier                                                          |
| `pnpm docker:dev`            | Levanta PostgreSQL y Redis (`docker:dev:down` los detiene)        |
| `pnpm prisma:migrate:dev <nombre>` | Crea una migración a partir de cambios en el esquema        |
| `pnpm prisma:migrate:deploy` | Aplica las migraciones pendientes                                 |
| `pnpm prisma:seed`           | Siembra los datos de demostración (no duplica si ya existen)      |
| `pnpm prisma:reseed`         | Borra todo, migra y vuelve a sembrar                              |

## Estructura

```
apps/
├── rutas/src/                 Servicio HTTP
│   ├── ordenes/               Crear, listar, salir a ruta y entregar
│   ├── repartidores/          Ruta optimizada y listado de despacho
│   ├── autenticacion/         Inicio de sesión y emisión del JWT
│   ├── shared/                Haversine, value objects, pertenencia de recursos
│   ├── testing/               Dobles en memoria para las pruebas
│   └── i18n/                  Mensajes en español e inglés
└── rutas-e2e/                 Pruebas e2e
libs/
├── result/                    Result<T, E>: los errores de negocio viajan como valores
├── exceptions/                Errores de dominio, sobre de respuesta, interceptor y filtro HTTP
├── security/                  JWT, permisos por rol, guards y pertenencia de recursos
├── prisma/                    Esquema, migraciones, seed y servicio con transacciones
├── transactions/              Puerto de transacciones y runAtomic
├── redis/                     Caché tolerante a fallos
└── health/                    GET /api/health
```

Cada funcionalidad de `apps/rutas/src` tiene tres capas:

```
<funcionalidad>/
├── domain/            Entidades, value objects, servicios y puertos. TypeScript puro.
├── application/       Casos de uso: un directorio por caso de uso.
└── infrastructure/
    ├── inbound/http/  Controllers y DTOs
    └── outbound/      Adaptadores de Prisma, Redis y JWT
```

`domain/` no puede importar NestJS, Prisma ni Redis, y `application/` no puede importar de
`infrastructure/`: lo comprueba ESLint.

## Dónde está cada regla

| Regla                                   | Archivo                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Distancia de Haversine                  | `apps/rutas/src/shared/domain/services/distancia-haversine.service.ts`    |
| Elegir repartidor                       | `apps/rutas/src/ordenes/domain/services/asignador-ordenes.service.ts`     |
| Optimizar la ruta                       | `apps/rutas/src/repartidores/domain/services/optimizador-ruta.service.ts` |
| Asignar, vaciar la cola y recalcular    | `apps/rutas/src/ordenes/application/services/despacho.service.ts`         |
| Estados y transiciones de una orden     | `apps/rutas/src/shared/domain/value-objects/estado-orden.vo.ts`           |
| Bloqueo de concurrencia                 | `apps/rutas/src/ordenes/infrastructure/outbound/persistence/pg-advisory-despacho-lock.adapter.ts` |
| Permisos de cada rol                    | `libs/security/src/lib/constants/roles.constant.ts`                       |
