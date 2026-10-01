import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { mapOk, ok, type Result } from '@almo/result';
import { ROLES } from '@almo/security/constants';
import type { Solicitante } from '../../../../shared/application/solicitante';
import { type FiltroOrdenes, OrdenRepository } from '../../../domain/ports/outbound/orden.repository.port';
import type { ListadoOrdenes, ListarOrdenesQuery } from './listar-ordenes.query';

/**
 * Lista órdenes con filtro por estado y paginación.
 *
 * El alcance depende de quién pregunta, y se aplica como filtro de la consulta
 * (no filtrando después): un cliente ve sus órdenes, un repartidor las que
 * tiene asignadas y el despacho (ADMIN) todas.
 */
@Injectable()
export class ListarOrdenesUseCase {
  constructor(@Inject(OrdenRepository) private readonly ordenes: OrdenRepository) {}

  async execute(query: ListarOrdenesQuery): Promise<Result<ListadoOrdenes, DomainError>> {
    const { page, limit, estado, solicitante } = query;

    const alcance = alcanceDe(solicitante);
    // Un repartidor sin vínculo no tiene órdenes que ver.
    if (alcance === null) return ok({ ordenes: [], total: 0, page, limit });

    const pagina = await this.ordenes.listar({ ...alcance, estado, page, limit });
    return mapOk(pagina, ({ ordenes, total }) => ({ ordenes, total, page, limit }));
  }
}

type Alcance = Pick<FiltroOrdenes, 'clienteId' | 'repartidorId'>;

function alcanceDe(solicitante: Solicitante): Alcance | null {
  switch (solicitante.rol) {
    case ROLES.ADMIN:
      return {};
    case ROLES.CLIENTE:
      return { clienteId: solicitante.usuarioId };
    case ROLES.REPARTIDOR:
      return solicitante.repartidorId === null ? null : { repartidorId: solicitante.repartidorId };
  }
}
