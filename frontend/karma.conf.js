// Karma ejecuta las pruebas en un Chrome real.
//   pnpm test     abre Chrome y vuelve a ejecutar al guardar un archivo.
//   pnpm test:ci  una sola pasada en ChromeHeadless, con cobertura.
const path = require('node:path');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    jasmineHtmlReporter: {
      suppressAll: true, // sin trazas duplicadas en el reporte HTML
    },
    coverageReporter: {
      dir: path.join(__dirname, 'coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'lcovonly' }],
      // Umbrales mínimos: si la cobertura baja de aquí, `pnpm test:ci` falla.
      check: {
        global: { statements: 90, branches: 80, functions: 90, lines: 90 },
      },
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
  });
};
