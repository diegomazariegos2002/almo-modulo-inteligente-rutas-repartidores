import { Inject, Injectable } from '@nestjs/common';
import { RedisCacheService } from '@almo/redis';
import { envs } from '../../../../config/rutas.envs';
import { RutaCache } from '../../../domain/ports/outbound/ruta-cache.port';
import type { Ruta } from '../../../domain/value-objects/ruta.vo';

const clave = (repartidorId: number): string => `rutas:ruta:repartidor:${repartidorId}`;

/**
 * Caché de rutas en Redis: una entrada por repartidor.
 *
 * El TTL es una red de seguridad; lo que mantiene el caché correcto es la
 * invalidación explícita cada vez que la ruta cambia.
 */
@Injectable()
export class RedisRutaCacheAdapter extends RutaCache {
  constructor(@Inject(RedisCacheService) private readonly redis: RedisCacheService) {
    super();
  }

  get(repartidorId: number): Promise<Ruta | null> {
    return this.redis.get<Ruta>(clave(repartidorId));
  }

  set(repartidorId: number, ruta: Ruta): Promise<void> {
    return this.redis.set(clave(repartidorId), ruta, envs.cacheTtlRutaSeconds);
  }

  invalidar(...repartidorIds: number[]): Promise<void> {
    return this.redis.del(...repartidorIds.map(clave));
  }
}
