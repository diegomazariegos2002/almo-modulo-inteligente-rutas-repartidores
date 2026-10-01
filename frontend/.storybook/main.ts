import type { StorybookConfig } from '@storybook/angular';

// Las stories viven junto a su componente, dentro de cada módulo de negocio.
const config: StorybookConfig = {
  stories: ['../src/app/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/angular',
  core: { disableTelemetry: true },
};

export default config;
