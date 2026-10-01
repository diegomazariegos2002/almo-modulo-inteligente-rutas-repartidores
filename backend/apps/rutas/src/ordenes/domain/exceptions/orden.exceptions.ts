import { ConflictError, NotFoundError } from '@almo/exceptions';
import { DESCRIPCION_ESTADO_ORDEN, type EstadoOrden } from '../../../shared/domain/value-objects/estado-orden.vo';

export class OrdenNoEncontrada extends NotFoundError {
  readonly code = 'RUTAS.ORDEN_NO_ENCONTRADA' as const;

  constructor(folio: string) {
    super({
      messageKey: 'errors.rutas.orden_no_encontrada',
      messageParams: { folio },
      message: `No existe una orden con el folio ${folio}.`,
    });
  }
}

/** Se pidió un cambio de estado que la máquina de estados no permite. */
export class TransicionEstadoInvalida extends ConflictError {
  readonly code = 'RUTAS.TRANSICION_ESTADO_INVALIDA' as const;

  constructor(folio: string, actual: EstadoOrden, solicitado: EstadoOrden) {
    const descripcionActual = DESCRIPCION_ESTADO_ORDEN[actual];
    const descripcionSolicitado = DESCRIPCION_ESTADO_ORDEN[solicitado];
    // Pedir el estado en el que ya está merece un mensaje más directo.
    const repetida = actual === solicitado;

    super({
      messageKey: repetida ? 'errors.rutas.transicion_estado_repetida' : 'errors.rutas.transicion_estado_invalida',
      messageParams: { folio, actual: descripcionActual, solicitado: descripcionSolicitado },
      message: repetida
        ? `La orden ${folio} ya está "${descripcionActual}".`
        : `La orden ${folio} está "${descripcionActual}" y no puede pasar a "${descripcionSolicitado}".`,
      metadata: { actual, solicitado },
    });
  }
}
