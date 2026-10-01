#!/usr/bin/env node
// Comprueba las convenciones de nombres y de ubicación de la arquitectura (módulos
// de negocio con capas Domain / Application / Infrastructure). Las dependencias
// entre capas las vigila ESLint (eslint-plugin-boundaries); este script cubre lo
// que ESLint no ve: dónde vive cada archivo y cómo se llama.
//
// Uso: pnpm check:architecture   (termina con código 1 si hay infracciones)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const RAIZ = 'src/app';
const MODULOS = ['Auth', 'Ordenes', 'Repartidores', 'Shared'];
const CAPAS = ['Domain', 'Application', 'Infrastructure'];
const CARPETAS_PROHIBIDAS = ['components', 'services', 'ports', 'interfaces', 'utils', 'helpers'];

/** Cada tipo de archivo (por su sufijo) tiene un único lugar donde puede vivir. */
const UBICACIONES = [
  { sufijo: '.entity.ts', dentroDe: '/Domain/' },
  { sufijo: '-http.repository.ts', dentroDe: '/Infrastructure/' },
  { sufijo: '.repository.ts', dentroDe: '/Domain/' },
  { sufijo: '.use-case.ts', dentroDe: '/Application/' },
  { sufijo: '.contract.ts', dentroDe: '/Application/contracts/' },
  { sufijo: '-state.service.ts', dentroDe: '/Application/' },
  { sufijo: '.adapter.ts', dentroDe: '/Infrastructure/Adapters/' },
  { sufijo: '.guard.ts', dentroDe: '/Infrastructure/Guards/' },
  { sufijo: '.interceptor.ts', dentroDe: '/Infrastructure/Interceptors/' },
  { sufijo: '.component.ts', dentroDe: '/Infrastructure/Angular/' },
  { sufijo: '.pipe.ts', dentroDe: '/Infrastructure/Angular/' },
  { sufijo: '.fixtures.ts', dentroDe: '/Infrastructure/Angular/_fixtures/' },
];

/** Únicos sufijos admitidos en las capas internas. */
const SUFIJOS_POR_CAPA = {
  Domain: ['.entity.ts', '.models.ts', '.repository.ts'],
  Application: ['.use-case.ts', '.contract.ts', '-state.service.ts'],
};

const infracciones = [];
const reportar = (archivo, mensaje) => infracciones.push(`${archivo}\n    ${mensaje}`);

/** Todos los archivos bajo `carpeta`, con rutas separadas por «/» en cualquier sistema. */
function listarArchivos(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = `${carpeta}/${entrada.name}`;
    return entrada.isDirectory() ? listarArchivos(ruta) : [ruta];
  });
}

const esPrueba = (archivo) => archivo.endsWith('.spec.ts');
const esKebab = (nombre) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(nombre);
const declaraClase = (codigo) => /^\s*(export\s+)?(abstract\s+)?class\s/m.test(codigo);

// ── 1. Estructura de los módulos ─────────────────────────────────────────────
for (const modulo of MODULOS) {
  for (const capa of CAPAS) {
    if (!existsSync(join(RAIZ, modulo, capa))) {
      reportar(`${RAIZ}/${modulo}`, `Falta la capa ${capa}/.`);
    }
  }
  const proveedores = `${modulo.toLowerCase()}.providers.ts`;
  if (!existsSync(join(RAIZ, modulo, proveedores))) {
    reportar(`${RAIZ}/${modulo}`, `Falta ${proveedores} (makeEnvironmentProviders del módulo).`);
  }
}

for (const entrada of readdirSync(RAIZ, { withFileTypes: true })) {
  const conocida = entrada.isDirectory()
    ? [...MODULOS, 'environments'].includes(entrada.name)
    : /^app(\.[a-z]+)*\.ts$/.test(entrada.name);
  if (!conocida) {
    reportar(
      `${RAIZ}/${entrada.name}`,
      'Solo se admiten módulos de negocio, environments/ y app.*.ts.',
    );
  }
}

// ── 2. Archivo por archivo ───────────────────────────────────────────────────
const archivos = listarArchivos(RAIZ);

for (const archivo of archivos) {
  const nombre = basename(archivo);
  const carpetas = dirname(archivo).split('/');

  const prohibida = carpetas.find((carpeta) => CARPETAS_PROHIBIDAS.includes(carpeta));
  if (prohibida) {
    reportar(archivo, `La carpeta «${prohibida}» no forma parte de la convención.`);
  }

  if (!nombre.endsWith('.ts') || esPrueba(nombre)) {
    continue;
  }

  // Ubicación según el sufijo. Gana la primera regla que coincide, por eso
  // «-http.repository.ts» va antes que «.repository.ts».
  const regla = UBICACIONES.find(({ sufijo }) => nombre.endsWith(sufijo));
  if (regla && !archivo.includes(regla.dentroDe)) {
    reportar(archivo, `Los archivos «*${regla.sufijo}» van en ${regla.dentroDe}`);
  }

  if (nombre.endsWith('.service.ts') && !nombre.endsWith('-state.service.ts')) {
    reportar(archivo, 'No se usa el sufijo «service»: es un use-case, un adapter o un repository.');
  }

  // Sufijos admitidos en Domain y Application.
  for (const [capa, sufijos] of Object.entries(SUFIJOS_POR_CAPA)) {
    if (carpetas.includes(capa) && !sufijos.some((sufijo) => nombre.endsWith(sufijo))) {
      reportar(archivo, `En ${capa}/ solo se admiten: ${sufijos.join(', ')}.`);
    }
  }

  const codigo = readFileSync(archivo, 'utf8');

  if (nombre.endsWith('.entity.ts') && !declaraClase(codigo)) {
    reportar(
      archivo,
      'Una entity es una clase con comportamiento. Si solo describe datos es un *.models.ts.',
    );
  }
  if (nombre.endsWith('.models.ts') && declaraClase(codigo)) {
    reportar(
      archivo,
      'Un *.models.ts solo contiene tipos y constantes. Una clase va en un *.entity.ts.',
    );
  }
  if (nombre.endsWith('.use-case.ts') && !/@Injectable\(\)[\s\S]*\bexecute\(/.test(codigo)) {
    reportar(archivo, 'Un caso de uso es una clase @Injectable() con un método execute().');
  }
  if (/\.(repository|contract)\.ts$/.test(nombre) && !nombre.endsWith('-http.repository.ts')) {
    if (!codigo.includes('new InjectionToken')) {
      reportar(archivo, 'La abstracción debe exponer su InjectionToken junto a la interfaz.');
    }
  }

  // Domain no conoce Angular: la única excepción es el token de sus repositorios.
  if (carpetas.includes('Domain')) {
    for (const [, importado, origen] of codigo.matchAll(
      /import\s+([^;]+?)\s+from\s+'(@angular\/[^']+)'/g,
    )) {
      if (origen !== '@angular/core' || importado.replace(/\s/g, '') !== '{InjectionToken}') {
        reportar(archivo, `Domain no puede importar ${importado.trim()} de ${origen}.`);
      }
    }
  }

  // Un componente vive en su propia carpeta kebab-case y se llama como ella.
  if (nombre.endsWith('.component.ts')) {
    const carpeta = carpetas.at(-1);
    if (!esKebab(carpeta) || nombre !== `${carpeta}.component.ts`) {
      reportar(
        archivo,
        'Se espera Infrastructure/Angular/<nombre-kebab>/<nombre-kebab>.component.ts.',
      );
    }
  }
}

// ── Resultado ────────────────────────────────────────────────────────────────
if (infracciones.length > 0) {
  console.error(`Arquitectura: ${infracciones.length} infracción(es).\n`);
  console.error(infracciones.map((infraccion) => `  ${infraccion}`).join('\n'));
  process.exit(1);
}

console.log(`Arquitectura: ${archivos.length} archivos revisados, sin infracciones.`);
