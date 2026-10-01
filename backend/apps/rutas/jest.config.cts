module.exports = {
  displayName: 'rutas',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/rutas',
  // La cobertura se mide sobre TODO el código del servicio, no solo sobre lo que importan los tests.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.fakes.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/config/**',
    // Adaptadores de Prisma y Redis: los verifican las pruebas e2e contra servicios reales.
    '!src/**/infrastructure/outbound/persistence/**',
    '!src/**/infrastructure/outbound/cache/**',
  ],
};
