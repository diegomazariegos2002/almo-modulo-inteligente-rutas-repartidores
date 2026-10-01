import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { PrismaService } from '@almo/prisma';
import { err, isErr, ok, type Result } from '@almo/result';
import { type OwnershipParams, RecursoAjenoError, ResourceOwnershipPort, ROLES, type UsuarioAutenticado } from '@almo/security';
import { OrdenNoEncontrada } from '../../../ordenes/domain/exceptions';
import { RepartidorNoEncontrado } from '../../../repartidores/domain/exceptions';
import { intentar } from '../outbound/persistence/intentar';

/** Tipos de recurso que este servicio sabe autorizar. */
export const RECURSO = {
  /** Una orden, para leerla. */
  ORDEN: 'orden',
  /** Una orden como parada de una ruta, para cambiar su estado. */
  PARADA: 'parada',
  /** La ruta de un repartidor. */
  RUTA_REPARTIDOR: 'ruta-repartidor',
} as const;

/**
 * Autorización a nivel de objeto del servicio de rutas.
 *
 * Primero comprueba que el recurso exista (404) y después que sea del usuario
 * (403): así un id inexistente responde siempre "no existe", como pide el
 * enunciado, y no "prohibido".
 *
 *  - Orden: la ve el cliente que la creó, el repartidor que la tiene asignada y el despacho.
 *  - Parada: solo la opera el repartidor que la tiene asignada.
 *  - Ruta: la ve su repartidor y el despacho.
 */
@Injectable()
export class RutasResourceOwnershipAdapter extends ResourceOwnershipPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async assertOwnership({ resourceType, resourceId, user }: OwnershipParams): Promise<Result<void, DomainError>> {
    switch (resourceType) {
      case RECURSO.ORDEN:
        return this.orden(resourceId, user, { soloRepartidorAsignado: false });
      case RECURSO.PARADA:
        return this.orden(resourceId, user, { soloRepartidorAsignado: true });
      case RECURSO.RUTA_REPARTIDOR:
        return this.rutaRepartidor(resourceId, user);
      default:
        return err(new RecursoAjenoError(resourceType, resourceId));
    }
  }

  private async orden(
    folio: string,
    user: UsuarioAutenticado,
    opciones: { soloRepartidorAsignado: boolean },
  ): Promise<Result<void, DomainError>> {
    const encontrada = await intentar('ownership.orden', () =>
      this.prisma.client.orden.findUnique({ where: { folio }, select: { clienteId: true, repartidorId: true } }),
    );
    if (isErr(encontrada)) return encontrada;
    if (!encontrada.value) return err(new OrdenNoEncontrada(folio));

    const { clienteId, repartidorId } = encontrada.value;
    const esSuRepartidor = user.rol === ROLES.REPARTIDOR && user.repartidorId !== null && user.repartidorId === repartidorId;

    const permitido = opciones.soloRepartidorAsignado
      ? esSuRepartidor
      : user.rol === ROLES.ADMIN || esSuRepartidor || (user.rol === ROLES.CLIENTE && user.sub === clienteId);

    return permitido ? ok(undefined) : err(new RecursoAjenoError(RECURSO.ORDEN, folio));
  }

  private async rutaRepartidor(id: string, user: UsuarioAutenticado): Promise<Result<void, DomainError>> {
    const repartidorId = Number(id);
    const encontrado = await intentar('ownership.repartidor', () =>
      this.prisma.client.repartidor.findUnique({ where: { id: repartidorId }, select: { id: true } }),
    );
    if (isErr(encontrado)) return encontrado;
    if (!encontrado.value) return err(new RepartidorNoEncontrado(repartidorId));

    const permitido = user.rol === ROLES.ADMIN || (user.rol === ROLES.REPARTIDOR && user.repartidorId === repartidorId);
    return permitido ? ok(undefined) : err(new RecursoAjenoError(RECURSO.RUTA_REPARTIDOR, id));
  }
}
