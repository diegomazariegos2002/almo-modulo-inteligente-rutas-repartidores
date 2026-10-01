import { Err } from './err';
import { Ok } from './ok';
import type { Result } from './result';

export function ok<T>(value: T): Ok<T> {
  return new Ok(value);
}

export function err<E>(error: E): Err<E> {
  return new Err(error);
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result._tag === 'ok';
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result._tag === 'err';
}

/** Distingue un `Result` de cualquier otro valor (lo usa la frontera HTTP). */
export function isResult(value: unknown): value is Result<unknown, unknown> {
  if (typeof value !== 'object' || value === null) return false;

  const candidato = value as { _tag?: unknown };
  return (candidato._tag === 'ok' && 'value' in candidato) || (candidato._tag === 'err' && 'error' in candidato);
}

/** Transforma el valor de la rama `ok`; un `err` pasa intacto. */
export function mapOk<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return isOk(result) ? result.value : fallback;
}
