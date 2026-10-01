/** Rama fallida de un `Result`: envuelve el error, que forma parte del tipo. */
export class Err<E> {
  readonly _tag = 'err' as const;

  constructor(readonly error: E) {}
}
