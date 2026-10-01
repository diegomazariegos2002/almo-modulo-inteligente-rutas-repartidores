const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('node:path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/rutas'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      // El package.json que genera Nx omite dependencias que solo se cargan en ejecución
      // (@prisma/client, pg, joi, tslib). La imagen Docker instala las de producción
      // desde el package.json de la raíz, con su lockfile.
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
