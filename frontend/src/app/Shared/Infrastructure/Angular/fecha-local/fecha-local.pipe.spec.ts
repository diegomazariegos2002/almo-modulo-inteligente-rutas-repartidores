import { FechaLocalPipe } from './fecha-local.pipe';

describe('FechaLocalPipe', () => {
  const pipe = new FechaLocalPipe();

  it('formatea la fecha con el idioma y la zona horaria del navegador', () => {
    const fecha = new Date('2026-09-30T15:00:00.000Z');
    const esperado = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(fecha);

    expect(pipe.transform(fecha)).toBe(esperado);
  });

  it('devuelve una cadena vacía si no hay fecha o no es válida', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(new Date('no es una fecha'))).toBe('');
  });
});
