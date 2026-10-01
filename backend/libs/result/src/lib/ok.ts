/** Rama exitosa de un `Result`: envuelve el valor producido. */
export class Ok<T> {
  readonly _tag = 'ok' as const;

  constructor(readonly value: T) {}
}
