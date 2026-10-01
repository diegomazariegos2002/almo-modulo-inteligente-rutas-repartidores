import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { type Prisma, PrismaService } from '@almo/prisma';
import type { Result } from '@almo/result';
import { intentar } from '../../../../shared/infrastructure/outbound/persistence/intentar';
import { ESTADO_ORDEN } from '../../../../shared/domain/value-objects/estado-orden.vo';
import type { Orden } from '../../../domain/entities/orden.entity';
import {
  type FiltroOrdenes,
  type NuevaOrden,
  OrdenRepository,
  type PaginaOrdenes,
} from '../../../domain/ports/outbound/orden.repository.port';
import { INCLUIR_ORDEN, OrdenPersistenceMapper } from './orden.persistence.mapper';

/*
 * Dentro de una transacción todas las consultas van por la misma conexión, y
 * una conexión atiende una consulta a la vez: por eso aquí se encadenan con
 * `await` y no se lanzan en paralelo con Promise.all.
 */
@Injectable()
export class PrismaOrdenRepository extends OrdenRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  crear(nueva: NuevaOrden): Promise<Result<Orden, DomainError>> {
    return intentar('orden.crear', async () => {
      // El folio no se envía: lo genera la base con su secuencia.
      const fila = await this.prisma.client.orden.create({
        data: {
          lat: nueva.destino.lat,
          lng: nueva.destino.lng,
          pesoKg: nueva.peso.kg,
          direccion: nueva.direccion,
          clienteId: nueva.clienteId,
          creadoEn: nueva.creadaEn,
          actualizadoEn: nueva.creadaEn,
          historial: { create: { estado: ESTADO_ORDEN.PENDIENTE_ASIGNACION, fecha: nueva.creadaEn } },
        },
        include: INCLUIR_ORDEN,
      });
      return OrdenPersistenceMapper.toDomain(fila);
    });
  }

  findByFolio(folio: string): Promise<Result<Orden | null, DomainError>> {
    return intentar('orden.findByFolio', async () => {
      const fila = await this.prisma.client.orden.findUnique({ where: { folio }, include: INCLUIR_ORDEN });
      return fila ? OrdenPersistenceMapper.toDomain(fila) : null;
    });
  }

  findPendientesDeAsignacion(): Promise<Result<Orden[], DomainError>> {
    return intentar('orden.findPendientesDeAsignacion', async () => {
      const filas = await this.prisma.client.orden.findMany({
        where: { estado: ESTADO_ORDEN.PENDIENTE_ASIGNACION },
        orderBy: [{ creadoEn: 'asc' }, { folio: 'asc' }],
        include: INCLUIR_ORDEN,
      });
      return filas.map(OrdenPersistenceMapper.toDomain);
    });
  }

  findAsignadasDe(repartidorId: number): Promise<Result<Orden[], DomainError>> {
    return intentar('orden.findAsignadasDe', async () => {
      const filas = await this.prisma.client.orden.findMany({
        where: { repartidorId, estado: ESTADO_ORDEN.ASIGNADA },
        orderBy: { secuenciaRuta: 'asc' },
        include: INCLUIR_ORDEN,
      });
      return filas.map(OrdenPersistenceMapper.toDomain);
    });
  }

  listar(filtro: FiltroOrdenes): Promise<Result<PaginaOrdenes, DomainError>> {
    return intentar('orden.listar', async () => {
      // Un filtro `undefined` no restringe: Prisma lo ignora.
      const where: Prisma.OrdenWhereInput = {
        estado: filtro.estado,
        clienteId: filtro.clienteId,
        repartidorId: filtro.repartidorId,
      };

      const total = await this.prisma.client.orden.count({ where });
      const filas = await this.prisma.client.orden.findMany({
        where,
        orderBy: [{ creadoEn: 'desc' }, { folio: 'desc' }],
        skip: (filtro.page - 1) * filtro.limit,
        take: filtro.limit,
        include: INCLUIR_ORDEN,
      });

      return { ordenes: filas.map(OrdenPersistenceMapper.toDomain), total };
    });
  }

  guardar(orden: Orden): Promise<Result<void, DomainError>> {
    return intentar('orden.guardar', async () => {
      await this.prisma.client.orden.update({
        where: { id: orden.id },
        data: {
          estado: orden.estado,
          repartidorId: orden.repartidor?.id ?? null,
          secuenciaRuta: orden.secuenciaRuta,
          actualizadoEn: orden.actualizadaEn,
          // El historial solo crece: se insertan los cambios nuevos, nunca se reescribe.
          historial: {
            create: orden.cambiosSinPersistir.map((cambio) => ({
              estado: cambio.estado,
              fecha: cambio.fecha,
              repartidorId: cambio.repartidorId,
            })),
          },
        },
      });
      orden.marcarPersistida();
    });
  }

  actualizarSecuencias(foliosEnOrden: readonly string[]): Promise<Result<void, DomainError>> {
    return intentar('orden.actualizarSecuencias', async () => {
      for (const [indice, folio] of foliosEnOrden.entries()) {
        const secuencia = indice + 1;
        // Solo toca la fila si su posición cambió, para no mover su fecha de actualización en vano.
        await this.prisma.client.orden.updateMany({
          where: { folio, OR: [{ secuenciaRuta: null }, { secuenciaRuta: { not: secuencia } }] },
          data: { secuenciaRuta: secuencia },
        });
      }
    });
  }
}
