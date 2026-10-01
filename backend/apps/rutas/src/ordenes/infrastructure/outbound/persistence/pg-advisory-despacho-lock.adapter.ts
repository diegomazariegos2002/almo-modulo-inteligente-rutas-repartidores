import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { PrismaService } from '@almo/prisma';
import type { Result } from '@almo/result';
import { intentar } from '../../../../shared/infrastructure/outbound/persistence/intentar';
import { DespachoLock } from '../../../domain/ports/outbound/despacho-lock.port';

/** Clave arbitraria que identifica "el despacho" entre los advisory locks de la base. */
const CLAVE_DESPACHO = 730_001;

/**
 * Bloqueo de despacho con un *advisory lock* transaccional de PostgreSQL.
 *
 * `pg_advisory_xact_lock(clave)` espera hasta obtener el bloqueo y PostgreSQL
 * lo libera solo al terminar la transacción (commit o rollback): no hay forma
 * de olvidarse de soltarlo. Como todas las operaciones de despacho piden la
 * misma clave, se ejecutan de una en una; al haber un único bloqueo no puede
 * existir un interbloqueo entre ellas.
 *
 * Con el nivel de aislamiento por defecto (READ COMMITTED) cada sentencia
 * posterior ve lo que confirmó el dueño anterior del bloqueo.
 */
@Injectable()
export class PgAdvisoryDespachoLock extends DespachoLock {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  adquirir(): Promise<Result<void, DomainError>> {
    return intentar('despacho.adquirirBloqueo', async () => {
      await this.prisma.client.$executeRaw`SELECT pg_advisory_xact_lock(${CLAVE_DESPACHO}::bigint)`;
    });
  }
}
