/**
 * Ajustes a los manifiestos de dependencias durante la resolución de pnpm.
 *
 * `@prisma/client` declara `prisma` (el CLI) y `typescript` como "peer dependencies"
 * opcionales. Como el CLI es una devDependency de este workspace, pnpm lo enlaza al
 * cliente y lo arrastra —junto con Prisma Studio, PGlite y TypeScript, unos 200 MB—
 * incluso en una instalación `--prod`. En ejecución el cliente no usa ninguno de los
 * dos, así que se le quitan: la imagen de producción queda sin herramientas de desarrollo.
 */
const PEERS_SOLO_DE_DESARROLLO = ['prisma', 'typescript'];

function readPackage(pkg) {
  if (pkg.name === '@prisma/client') {
    for (const nombre of PEERS_SOLO_DE_DESARROLLO) {
      if (pkg.peerDependencies) delete pkg.peerDependencies[nombre];
      if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta[nombre];
    }
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
