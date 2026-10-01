import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import type { Result } from '@almo/result';
import type { Repartidor } from '../../../domain/entities/repartidor.entity';
import { RepartidorRepository } from '../../../domain/ports/outbound/repartidor.repository.port';

/** Listado de despacho: todos los repartidores con su estado, carga y paradas pendientes. */
@Injectable()
export class ListarRepartidoresUseCase {
  constructor(@Inject(RepartidorRepository) private readonly repartidores: RepartidorRepository) {}

  execute(): Promise<Result<Repartidor[], DomainError>> {
    return this.repartidores.findAll();
  }
}
