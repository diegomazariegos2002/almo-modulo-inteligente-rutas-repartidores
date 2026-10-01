import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { PrismaService } from '@almo/prisma';
import type { Result } from '@almo/result';
import { ESTADOS_PARADA_PENDIENTE } from '../../../../shared/domain/value-objects/estado-orden.vo';
import { intentar } from '../../../../shared/infrastructure/outbound/persistence/intentar';
import { Repartidor } from '../../../domain/entities/repartidor.entity';
import { RepartidorRepository } from '../../../domain/ports/outbound/repartidor.repository.port';
import { ESTADO_REPARTIDOR, type EstadoRepartidor } from '../../../domain/value-objects/estado-repartidor.vo';
import type { ParadaPendiente } from '../../../domain/value-objects/parada.vo';

interface FilaRepartidor {
  id: number;
  nombre: string;
  lat: { toNumber(): number };
  lng: { toNumber(): number };
  estado: EstadoRepartidor;
  capacidadKg: { toNumber(): number };
}

interface Carga {
  cargaKg: number;
  paradasPendientes: number;
}

const SIN_CARGA: Carga = { cargaKg: 0, paradasPendientes: 0 };

@Injectable()
export class PrismaRepartidorRepository extends RepartidorRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  findById(id: number): Promise<Result<Repartidor | null, DomainError>> {
    return intentar('repartidor.findById', async () => {
      const fila = await this.prisma.client.repartidor.findUnique({ where: { id } });
      if (!fila) return null;

      const cargas = await this.cargas([id]);
      return this.toDomain(fila, cargas);
    });
  }

  findAll(): Promise<Result<Repartidor[], DomainError>> {
    return intentar('repartidor.findAll', async () => {
      const filas = await this.prisma.client.repartidor.findMany({ orderBy: { id: 'asc' } });
      const cargas = await this.cargas(filas.map((fila) => fila.id));
      return filas.map((fila) => this.toDomain(fila, cargas));
    });
  }

  findDisponibles(): Promise<Result<Repartidor[], DomainError>> {
    return intentar('repartidor.findDisponibles', async () => {
      const filas = await this.prisma.client.repartidor.findMany({
        where: { estado: ESTADO_REPARTIDOR.DISPONIBLE },
        orderBy: { id: 'asc' },
      });
      const cargas = await this.cargas(filas.map((fila) => fila.id));
      return filas.map((fila) => this.toDomain(fila, cargas));
    });
  }

  findParadasPendientes(repartidorId: number): Promise<Result<ParadaPendiente[], DomainError>> {
    return intentar('repartidor.findParadasPendientes', async () => {
      const filas = await this.prisma.client.orden.findMany({
        where: { repartidorId, estado: { in: [...ESTADOS_PARADA_PENDIENTE] } },
        // Una parada recién asignada aún no tiene posición: va al final hasta que se reordena.
        orderBy: [{ secuenciaRuta: { sort: 'asc', nulls: 'last' } }, { creadoEn: 'asc' }],
        select: { folio: true, lat: true, lng: true, pesoKg: true, direccion: true, estado: true },
      });

      return filas.map((fila) => ({
        folio: fila.folio,
        lat: fila.lat.toNumber(),
        lng: fila.lng.toNumber(),
        pesoKg: fila.pesoKg.toNumber(),
        direccion: fila.direccion,
        estado: fila.estado,
      }));
    });
  }

  guardar(repartidor: Repartidor): Promise<Result<void, DomainError>> {
    return intentar('repartidor.guardar', async () => {
      await this.prisma.client.repartidor.update({
        where: { id: repartidor.id },
        data: { estado: repartidor.estado, lat: repartidor.lat, lng: repartidor.lng },
      });
    });
  }

  /** Peso total y número de paradas pendientes de cada repartidor, en una sola consulta. */
  private async cargas(repartidorIds: number[]): Promise<Map<number, Carga>> {
    if (repartidorIds.length === 0) return new Map();

    const grupos = await this.prisma.client.orden.groupBy({
      by: ['repartidorId'],
      where: { repartidorId: { in: repartidorIds }, estado: { in: [...ESTADOS_PARADA_PENDIENTE] } },
      _sum: { pesoKg: true },
      _count: { _all: true },
    });

    const cargas = new Map<number, Carga>();
    for (const grupo of grupos) {
      if (grupo.repartidorId === null) continue;
      cargas.set(grupo.repartidorId, {
        cargaKg: grupo._sum.pesoKg?.toNumber() ?? 0,
        paradasPendientes: grupo._count._all,
      });
    }
    return cargas;
  }

  private toDomain(fila: FilaRepartidor, cargas: Map<number, Carga>): Repartidor {
    const carga = cargas.get(fila.id) ?? SIN_CARGA;
    return new Repartidor({
      id: fila.id,
      nombre: fila.nombre,
      lat: fila.lat.toNumber(),
      lng: fila.lng.toNumber(),
      estado: fila.estado,
      capacidadKg: fila.capacidadKg.toNumber(),
      cargaKg: carga.cargaKg,
      paradasPendientes: carga.paradasPendientes,
    });
  }
}
