import { type DynamicModule, Global, Module } from '@nestjs/common';
import { REDIS_OPTIONS, type RedisCacheModuleOptions } from './redis-cache-options';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({})
export class RedisCacheModule {
  static register(options: RedisCacheModuleOptions): DynamicModule {
    return {
      module: RedisCacheModule,
      providers: [{ provide: REDIS_OPTIONS, useValue: options }, RedisCacheService],
      exports: [RedisCacheService],
    };
  }
}
