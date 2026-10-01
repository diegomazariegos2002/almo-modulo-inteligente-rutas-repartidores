import { NotFoundError } from '@almo/exceptions';

export class RepartidorNoEncontrado extends NotFoundError {
  readonly code = 'RUTAS.REPARTIDOR_NO_ENCONTRADO' as const;

  constructor(id: number | string) {
    super({
      messageKey: 'errors.rutas.repartidor_no_encontrado',
      messageParams: { id },
      message: `No existe un repartidor con el id ${id}.`,
    });
  }
}
