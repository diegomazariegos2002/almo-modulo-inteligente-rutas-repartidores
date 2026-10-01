import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/generated', '**/migrations', '**/coverage'],
  },

  // ── Fronteras entre proyectos Nx ────────────────────────────────────────
  // Apps y e2e solo dependen de libs; una lib solo depende de otras libs.
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:lib'] },
            { sourceTag: 'type:lib', onlyDependOnLibsWithTags: ['type:lib'] },
            { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:lib'] },
          ],
        },
      ],
    },
  },

  // ── Calidad de código TypeScript ────────────────────────────────────────
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: false } },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'class', format: ['PascalCase'] },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-throw-literal': 'error',
    },
  },

  // ── Tests, dobles de prueba, configuración y seeds: reglas relajadas ─────
  // (el proyecto e2e relaja las suyas en su propio eslint.config.mjs)
  {
    files: [
      '**/*.spec.ts',
      '**/*.fakes.ts',
      '**/*.config.ts',
      '**/*.config.cts',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/webpack.config.*',
      '**/jest.preset.*',
      '**/seed/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-console': 'off',
    },
  },

  // ── Hexagonal: capa de dominio ──────────────────────────────────────────
  // TypeScript puro: sin framework, sin persistencia, sin capas externas.
  {
    files: ['**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@nestjs/*'], message: 'El dominio no puede importar NestJS: es TypeScript puro.' },
            { group: ['@prisma/*', 'prisma', '@almo/prisma'], message: 'El dominio no puede importar Prisma: define un puerto.' },
            { group: ['ioredis', '@almo/redis'], message: 'El dominio no puede importar Redis: define un puerto.' },
            {
              group: ['**/application/**', '**/infrastructure/**'],
              message: 'El dominio no puede importar de application/ ni de infrastructure/.',
            },
          ],
        },
      ],
    },
  },

  // ── Hexagonal: capa de aplicación ───────────────────────────────────────
  // Orquesta el dominio. De NestJS solo se admite @nestjs/common (Injectable, Inject).
  {
    files: ['**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/swagger', '@nestjs/platform-express', '@nestjs/jwt', '@nestjs/core'],
              message: 'La capa de aplicación solo puede usar @nestjs/common (Injectable, Inject).',
            },
            { group: ['@prisma/*', 'prisma', '@almo/prisma'], message: 'La aplicación no puede importar Prisma: usa los puertos del dominio.' },
            { group: ['ioredis', '@almo/redis'], message: 'La aplicación no puede importar Redis: usa los puertos del dominio.' },
            { group: ['**/infrastructure/**'], message: 'La aplicación no puede importar de infrastructure/.' },
          ],
        },
      ],
    },
  },
];
