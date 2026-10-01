module.exports = {
  displayName: 'rutas-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  // Cada prueba habla con el servicio real y con PostgreSQL: necesita más que los 5 s por defecto.
  testTimeout: 60_000,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/rutas-e2e',
  // Las pruebas e2e no miden cobertura: ejercitan un proceso aparte.
  coverageThreshold: undefined,
};
