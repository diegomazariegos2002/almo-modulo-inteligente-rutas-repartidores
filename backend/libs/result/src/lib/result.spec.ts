import { err, isErr, isOk, isResult, mapOk, ok, unwrapOr } from './result.utils';
import type { Result } from './result';

describe('Result', () => {
  it('ok() crea la rama exitosa con su valor', () => {
    const result: Result<number, string> = ok(42);

    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (isOk(result)) expect(result.value).toBe(42);
  });

  it('err() crea la rama fallida con su error', () => {
    const result: Result<number, string> = err('falló');

    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
    if (isErr(result)) expect(result.error).toBe('falló');
  });

  describe('mapOk', () => {
    it('transforma el valor de un ok', () => {
      const result = mapOk(ok(2), (n) => n * 10);

      expect(isOk(result) && result.value).toBe(20);
    });

    it('deja pasar un err sin ejecutar la función', () => {
      const fn = jest.fn();
      const original: Result<number, string> = err('falló');

      const result = mapOk(original, fn);

      expect(result).toBe(original);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('unwrapOr', () => {
    it('devuelve el valor de un ok', () => {
      expect(unwrapOr(ok('a'), 'b')).toBe('a');
    });

    it('devuelve el valor por defecto de un err', () => {
      expect(unwrapOr(err('x') as Result<string, string>, 'b')).toBe('b');
    });
  });

  describe('isResult', () => {
    it('reconoce ok y err', () => {
      expect(isResult(ok(1))).toBe(true);
      expect(isResult(err('x'))).toBe(true);
    });

    it('rechaza cualquier otro valor', () => {
      expect(isResult(null)).toBe(false);
      expect(isResult(undefined)).toBe(false);
      expect(isResult('ok')).toBe(false);
      expect(isResult({ _tag: 'ok' })).toBe(false);
      expect(isResult({ _tag: 'otro', value: 1 })).toBe(false);
      expect(isResult([1, 2])).toBe(false);
    });
  });
});
