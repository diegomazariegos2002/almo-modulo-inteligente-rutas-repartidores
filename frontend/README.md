# Rutas — frontend

Interfaz del módulo de asignación inteligente de rutas para repartidores. Consume la API
descrita en [`docs/contrato-api.md`](../docs/contrato-api.md).

**Stack:** Angular 20 (componentes standalone, signals, `OnPush`), Angular Material, Tailwind
CSS 4, Storybook 10, Karma + Jasmine, ESLint 9 y Prettier.

## Requisitos

- Node 22 o superior (`.nvmrc`).
- pnpm 10 (`corepack enable` lo activa con la versión del `package.json`).

## Puesta en marcha

```bash
pnpm install
pnpm start          # http://localhost:4200
```

La aplicación llama siempre a rutas relativas (`/api/...`). En desarrollo `ng serve` las reenvía
al backend con `proxy.conf.mjs`, por defecto a `http://localhost:3000`. Para usar otro destino:

```bash
API_PROXY_TARGET=http://localhost:8080 pnpm start             # bash
$env:API_PROXY_TARGET = 'http://localhost:8080'; pnpm start   # PowerShell
```

La pantalla de inicio de sesión ofrece las cuentas de demostración del seed (cliente,
repartidores y despacho): basta elegir una y pulsar «Ingresar».

## Comandos

| Comando                   | Qué hace                                                         |
| ------------------------- | ---------------------------------------------------------------- |
| `pnpm start`              | Servidor de desarrollo en el puerto 4200, con proxy de `/api`    |
| `pnpm build`              | Build de producción en `dist/rutas-frontend/browser`             |
| `pnpm test`               | Pruebas en Chrome, en modo observación                           |
| `pnpm test:ci`            | Pruebas en ChromeHeadless, una pasada, con cobertura y umbrales  |
| `pnpm lint`               | ESLint: reglas de Angular, accesibilidad y dependencias por capa |
| `pnpm format`             | Formatea con Prettier (`pnpm format:check` solo comprueba)       |
| `pnpm check:architecture` | Comprueba nombres y ubicación de archivos según la arquitectura  |
| `pnpm storybook`          | Storybook en el puerto 6006                                      |
| `pnpm build-storybook`    | Storybook estático en `storybook-static/`                        |
| `pnpm quality`            | `format:check` + `lint` + `check:architecture` + `test:ci`       |

## Pantallas

| Ruta             | Pantalla                                                 | Permiso                   |
| ---------------- | -------------------------------------------------------- | ------------------------- |
| `/login`         | Inicio de sesión                                         | —                         |
| `/ordenes/nueva` | Vista de cliente: formulario para crear una orden        | `rutas:orden:crear`       |
| `/ordenes`       | Listado con filtro por estado, paginación e historial    | `rutas:orden:listar`      |
| `/mi-ruta`       | Vista de repartidor: paradas en orden, distancias y mapa | `rutas:ruta:leer`         |
| `/despacho`      | Repartidores y la ruta de cada uno, en solo lectura      | `rutas:repartidor:listar` |

La navegación y la pantalla inicial se construyen con los permisos que devuelve el login, no
con el rol. Una dirección sin permiso muestra la página 403 y una desconocida, la 404.

## Estructura

Clean Architecture con módulos por capacidad de negocio. Cada módulo tiene las mismas tres
capas y un archivo de providers.

```
src/app/
├── Auth/                      inicio de sesión, sesión, guards e interceptor del token
├── Ordenes/                   crear, listar y cambiar el estado de las órdenes
├── Repartidores/              ruta del repartidor y vista de despacho
├── Shared/                    errores, logging y componentes comunes (shell, avisos, paginador)
├── environments/              configuración por entorno y cuentas de demostración
├── app.config.ts              raíz de composición: enrutador, HTTP y providers de cada módulo
└── app.routes.ts              rutas, con sus guards de sesión y de permiso

<Modulo>/
├── Domain/                    sin Angular ni HTTP
│   ├── *.entity.ts            clases con comportamiento (fromPlain)
│   ├── *.models.ts            tipos y constantes
│   └── *.repository.ts        interfaz de acceso a datos + InjectionToken
├── Application/
│   ├── *.use-case.ts          un caso de uso por archivo, con execute()
│   └── contracts/*.contract.ts   abstracciones que no son de datos + InjectionToken
├── Infrastructure/
│   ├── *-http.repository.ts   implementación HTTP del repositorio
│   ├── Adapters/              implementaciones de los contratos
│   ├── Guards/  Interceptors/
│   └── Angular/<componente>/  .ts, .html, .spec.ts y .stories.ts juntos
│       └── _fixtures/         datos de ejemplo para stories y pruebas
└── <modulo>.providers.ts      registra token → implementación
```

Reglas que se comprueban solas:

- **Dependencias entre capas** (`pnpm lint`, con `eslint-plugin-boundaries`): Domain solo
  importa Domain; Application importa Domain y Application; Infrastructure puede importar las
  tres y `environments`. Domain y Application no pueden usar `HttpClient` ni `environments`.
- **Nombres y ubicación** (`pnpm check:architecture`): cada sufijo de archivo tiene su carpeta,
  una entity es una clase y un model no, un caso de uso expone `execute()`, etc.
- **`console` prohibido**: el diagnóstico pasa por `LOGGER_CONTRACT`.

## Storybook

Las stories viven junto a cada componente y se agrupan por módulo en la barra lateral
(`Shared/…`, `Auth/…`, `Ordenes/…`, `Repartidores/…`). Los componentes de presentación tienen
una story por estado; las páginas se montan con repositorios de mentira, así que se pueden
recorrer sin backend (por ejemplo `Repartidores/MiRutaPage` permite iniciar la ruta y entregar
cada parada). El panel de accesibilidad (`addon-a11y`) audita cada story con axe-core.

Hay dos formas de verlo, las dos en http://localhost:6006:

- `pnpm storybook`: servidor de desarrollo, con recarga al editar un componente.
- `docker compose up --build` en la raíz del repositorio: lo sirve ya compilado, sin instalar nada.

## Decisiones que conviene conocer

- **Sesión en `sessionStorage`.** Sobrevive a una recarga y cada pestaña tiene la suya, lo que
  permite probar a la vez un cliente y un repartidor. Está detrás de `SESION_CONTRACT`.
- **Errores.** `errorInterceptor` convierte cualquier fallo HTTP en un `ErrorAplicacion` con un
  mensaje en español según el `code` del contrato; los `details` de una validación se muestran
  en el campo correspondiente del formulario. `authInterceptor` cierra la sesión ante un 401.
- **Sin peticiones externas.** La tipografía es la del sistema, los iconos van empaquetados
  (`material-icons`) y el mapa de la ruta es un SVG dibujado con las coordenadas.
- **pnpm con `nodeLinker: hoisted`** (`pnpm-workspace.yaml`). Storybook y el builder de Angular
  deben compartir una única instancia de webpack; el motivo está comentado en ese archivo.
