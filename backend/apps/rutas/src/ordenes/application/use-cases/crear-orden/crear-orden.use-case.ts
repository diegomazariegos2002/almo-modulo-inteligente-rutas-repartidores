import { Inject, Injectable } from '@nestjs/common';
import { type DomainError, EntradaInvalidaError } from '@almo/exceptions';
import { err, isErr, isOk, ok, type Result } from '@almo/result';
import { runAtomic, TransactionManagerPort } from '@almo/transactions';
import { RepartidorRepository } from '../../../../repartidores/domain/ports/outbound/repartidor.repository.port';
import { RutaCache } from '../../../../repartidores/domain/ports/outbound/ruta-cache.port';
import { Coordenada } from '../../../../shared/domain/value-objects/coordenada.vo';
import { Peso } from '../../../../shared/domain/value-objects/peso.vo';
import type { Orden } from '../../../domain/entities/orden.entity';
import { OrdenNoEncontrada } from '../../../domain/exceptions';
import { DespachoLock } from '../../../domain/ports/outbound/despacho-lock.port';
import { OrdenRepository } from '../../../domain/ports/outbound/orden.repository.port';
import { DespachoService } from '../../services/despacho.service';
import type { CrearOrdenCommand } from './crear-orden.command';

/**
 * Registra una orden y dispara la asignación automática.
 *
 * Todo ocurre en UNA transacción y bajo el bloqueo de despacho: registrar la
 * orden, elegir al repartidor disponible más cercano con capacidad, asignarla
 * y reordenar la ruta de ese repartidor. Si llegan varias órdenes a la vez se
 * atienden una por una, así ninguna decide con datos que otra está cambiando.
 *
 * Si nadie puede recibirla, la orden queda PENDIENTE_ASIGNACION (en cola): es un
 * resultado válido, no un error.
 */
@Injectable()
export class CrearOrdenUseCase {
  constructor(
    @Inject(TransactionManagerPort) private readonly txManager: TransactionManagerPort,
    @Inject(DespachoLock) private readonly lock: DespachoLock,
    @Inject(OrdenRepository) private readonly ordenes: OrdenRepository,
    @Inject(RepartidorRepository) private readonly repartidores: RepartidorRepository,
    @Inject(DespachoService) private readonly despacho: DespachoService,
    @Inject(RutaCache) private readonly rutaCache: RutaCache,
  ) {}

  async execute(cmd: CrearOrdenCommand): Promise<Result<Orden, DomainError>> {
    const errores = [...Coordenada.validar(cmd.lat, cmd.lng), ...Peso.validar(cmd.peso)];
    if (errores.length > 0) return err(new EntradaInvalidaError(errores));

    const ahora = new Date();

    const resultado = await runAtomic(this.txManager, async (): Promise<Result<Orden, DomainError>> => {
      const bloqueo = await this.lock.adquirir();
      if (isErr(bloqueo)) return bloqueo;

      const creada = await this.ordenes.crear({
        clienteId: cmd.clienteId,
        destino: Coordenada.de(cmd.lat, cmd.lng),
        peso: Peso.de(cmd.peso),
        direccion: cmd.direccion?.trim() || null,
        creadaEn: ahora,
      });
      if (isErr(creada)) return creada;

      const candidatos = await this.repartidores.findDisponibles();
      if (isErr(candidatos)) return candidatos;

      const asignada = await this.despacho.asignar(creada.value, candidatos.value, ahora);
      if (isErr(asignada)) return asignada;
      if (!asignada.value) return ok(creada.value); // nadie disponible: queda en cola

      const reordenada = await this.despacho.recalcularRuta(asignada.value);
      if (isErr(reordenada)) return reordenada;

      // Se relee para devolverla con la posición que le tocó en la ruta.
      const actualizada = await this.ordenes.findByFolio(creada.value.folio);
      if (isErr(actualizada)) return actualizada;
      return actualizada.value ? ok(actualizada.value) : err(new OrdenNoEncontrada(creada.value.folio));
    });

    // El caché se invalida DESPUÉS del commit: antes, otro lector podría volver a
    // llenarlo con la ruta vieja. Nunca dentro de la transacción (es una llamada de red).
    if (isOk(resultado) && resultado.value.repartidor) {
      await this.rutaCache.invalidar(resultado.value.repartidor.id);
    }

    return resultado;
  }
}
