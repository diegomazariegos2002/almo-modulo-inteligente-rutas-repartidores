// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Capas a las que puede importar cada capa. Es la regla de dependencias de Clean Architecture. */
const DEPENDENCIAS_PERMITIDAS = {
  domain: ['domain'],
  application: ['domain', 'application'],
  infrastructure: ['domain', 'application', 'infrastructure', 'environments'],
  // Raíz de composición (app.config, app.routes, *.providers): une las capas.
  composition: ['domain', 'application', 'infrastructure', 'environments', 'composition'],
};

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'storybook-static/', '.angular/', 'node_modules/'] },

  // ── TypeScript de la aplicación ──────────────────────────────────────────────
  {
    files: ['src/**/*.ts', '.storybook/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: { boundaries },
    settings: {
      // Hace que `boundaries` entienda los alias de tsconfig (@auth, @shared, ...).
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': ['src/app/**/*.ts'],
      'boundaries/elements': [
        { type: 'domain', pattern: 'Domain', mode: 'folder' },
        { type: 'application', pattern: 'Application', mode: 'folder' },
        { type: 'infrastructure', pattern: 'Infrastructure', mode: 'folder' },
        { type: 'environments', pattern: 'environments', mode: 'folder' },
        { type: 'composition', pattern: ['app/app*.ts', '*.providers.ts'], mode: 'file' },
      ],
    },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // El diagnóstico pasa por LOGGER_CONTRACT, nunca por `console`.
      'no-console': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: Object.entries(DEPENDENCIAS_PERMITIDAS).map(([capa, permitidas]) => ({
            from: { type: capa },
            allow: { to: { type: permitidas } },
          })),
        },
      ],
    },
  },

  // ── Domain y Application: sin HTTP ni configuración de entorno ───────────────
  {
    files: ['src/app/*/Domain/**/*.ts', 'src/app/*/Application/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/common/http',
              message:
                'HttpClient es de Infrastructure. Aquí se depende del Repository o del Contract.',
            },
          ],
          patterns: [
            {
              group: ['@env/*', '**/environments/*'],
              message: 'La configuración de entorno solo se lee desde Infrastructure.',
            },
          ],
        },
      ],
    },
  },

  // ── Únicos archivos que pueden usar `console` ────────────────────────────────
  {
    files: ['src/main.ts', 'src/app/Shared/Infrastructure/Adapters/console-logger.adapter.ts'],
    rules: { 'no-console': 'off' },
  },

  // ── Pruebas: usan dobles de cualquier capa ───────────────────────────────────
  {
    files: ['src/**/*.spec.ts'],
    rules: { 'boundaries/dependencies': 'off' },
  },

  // ── Plantillas HTML ──────────────────────────────────────────────────────────
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },

  // ── Scripts y configuración que corren en Node ───────────────────────────────
  {
    files: ['*.{js,mjs}', 'scripts/**/*.mjs'],
    extends: [eslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
);
