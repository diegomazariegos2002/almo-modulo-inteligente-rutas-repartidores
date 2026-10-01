const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,

  coverageReporters: ['text', 'text-summary', 'lcov'],

  // El cliente generado por Prisma y los archivos de arranque no son lógica
  // propia: quedan fuera de la medición.
  coveragePathIgnorePatterns: ['/node_modules/', '/generated/', '/seed/', '/testing/', 'index.ts$', 'main.ts$', '\\.module\\.ts$'],

  // Mínimos globales por proyecto: evitan que la cobertura baje sin notarlo.
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
};
