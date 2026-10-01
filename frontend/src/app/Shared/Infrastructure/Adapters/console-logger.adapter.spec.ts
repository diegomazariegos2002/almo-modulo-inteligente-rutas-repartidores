import { ConsoleLoggerAdapter } from './console-logger.adapter';

describe('ConsoleLoggerAdapter', () => {
  const logger = new ConsoleLoggerAdapter();

  it('escribe las advertencias con console.warn', () => {
    const warn = spyOn(console, 'warn');

    logger.warn('Sesión descartada', { motivo: 'expirada' });

    expect(warn).toHaveBeenCalledOnceWith('Sesión descartada', { motivo: 'expirada' });
  });

  it('escribe los errores con console.error, también sin contexto', () => {
    const error = spyOn(console, 'error');

    logger.error('Falló GET /api/ordenes');

    expect(error).toHaveBeenCalledOnceWith('Falló GET /api/ordenes', '');
  });
});
