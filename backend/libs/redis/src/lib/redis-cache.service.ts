import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_OPTIONS, type RedisCacheModuleOptions } from './redis-cache-options';

/**
 * Caché sobre Redis que nunca rompe la petición.
 *
 * Un fallo de Redis se trata como "no hay caché": la lectura devuelve `null` y
 * la escritura se ignora. La base de datos sigue siendo la fuente de verdad.
 */
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis;

  constructor(@Inject(REDIS_OPTIONS) options: RedisCacheModuleOptions) {
    this.client = new Redis({
      host: options.host,
      port: options.port,
      password: options.password || undefined,
      lazyConnect: true,
      // Falla rápido en lugar de encolar comandos mientras Redis no responde.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.client.on('error', (error: Error) => this.logger.warn(`Redis no disponible: ${error.message}`));
    this.client.connect().catch(() => undefined);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Sin caché la respuesta sigue siendo correcta, solo más lenta.
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch {
      // La entrada expirará por TTL.
    }
  }

  /** Comprobación de vida para `/health`; aquí sí se propaga el error. */
  async ping(): Promise<void> {
    const respuesta = await this.client.ping();
    if (respuesta !== 'PONG') throw new Error(`Respuesta inesperada de Redis: ${respuesta}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
