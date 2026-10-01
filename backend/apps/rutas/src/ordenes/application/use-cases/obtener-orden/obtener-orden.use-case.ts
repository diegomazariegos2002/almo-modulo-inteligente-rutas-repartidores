import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { err, isErr, ok, type Result } from '@almo/result';
import type { Orden } from '../../../domain/entities/orden.entity';
import { OrdenNoEncontrada } from '../../../domain/exceptions';
import { OrdenRepository } from '../../../domain/ports/outbound/orden.repository.port';

/** Detalle de una orden por su folio, con el historial de cambios de estado. */
@Injectable()
export class ObtenerOrdenUseCase {
  constructor(@Inject(OrdenRepository) private readonly ordenes: OrdenRepository) {}

  async execute(folio: string): Promise<Result<Orden, DomainError>> {
    const encontrada = await this.ordenes.findByFolio(folio);
    if (isErr(encontrada)) return encontrada;

    return encontrada.value ? ok(encontrada.value) : err(new OrdenNoEncontrada(folio));
  }
}
