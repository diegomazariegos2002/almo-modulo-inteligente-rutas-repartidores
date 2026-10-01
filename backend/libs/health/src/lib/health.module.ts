import { Module, type OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@almo/prisma';
import { RedisCacheService } from '@almo/redis';
import { HealthController } from './health.controller';
import { HealthIndicatorRegistry } from './health-indicator.registry';

/** Expone `GET /health`. Los indicadores se agregan con los módulos de abajo. */
@Module({
  controllers: [HealthController],
  providers: [HealthIndicatorRegistry],
  exports: [HealthIndicatorRegistry],
})
export class HealthModule {}

/** Indicador crítico: sin base de datos el servicio no puede operar. */
@Module({ imports: [HealthModule] })
export class PrismaHealthModule implements OnModuleInit {
  constructor(
    private readonly registry: HealthIndicatorRegistry,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.registry.register({ name: 'database', critical: true, check: () => this.prisma.ping() });
  }
}

/** Indicador no crítico: sin caché el servicio responde igual, solo más lento. */
@Module({ imports: [HealthModule] })
export class RedisHealthModule implements OnModuleInit {
  constructor(
    private readonly registry: HealthIndicatorRegistry,
    private readonly redis: RedisCacheService,
  ) {}

  onModuleInit(): void {
    this.registry.register({ name: 'cache', critical: false, check: () => this.redis.ping() });
  }
}
