import type { Prisma } from '@almo/prisma';
import { Orden } from '../../../domain/entities/orden.entity';

/** Relaciones que siempre se cargan con una orden: su repartidor y su historial en orden. */
export const INCLUIR_ORDEN = {
  repartidor: { select: { id: true, nombre: true } },
  historial: { orderBy: { id: 'asc' } },
} satisfies Prisma.OrdenInclude;

export type FilaOrden = Prisma.OrdenGetPayload<{ include: typeof INCLUIR_ORDEN }>;

/** Único lugar donde conviven los tipos de Prisma y los del dominio de órdenes. */
export class OrdenPersistenceMapper {
  static toDomain(fila: FilaOrden): Orden {
    return new Orden({
      id: fila.id,
      folio: fila.folio,
      lat: fila.lat.toNumber(),
      lng: fila.lng.toNumber(),
      pesoKg: fila.pesoKg.toNumber(),
      direccion: fila.direccion,
      estado: fila.estado,
      clienteId: fila.clienteId,
      repartidor: fila.repartidor,
      secuenciaRuta: fila.secuenciaRuta,
      creadaEn: fila.creadoEn,
      actualizadaEn: fila.actualizadoEn,
      historial: fila.historial.map((cambio) => ({
        estado: cambio.estado,
        fecha: cambio.fecha,
        repartidorId: cambio.repartidorId,
      })),
    });
  }
}
