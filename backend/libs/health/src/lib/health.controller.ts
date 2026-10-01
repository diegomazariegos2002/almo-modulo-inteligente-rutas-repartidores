import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipResultHttpInterceptor } from '@almo/exceptions/nestjs';
import { Public } from '@almo/security';
import type { Response } from 'express';
import { HealthIndicatorRegistry, type HealthReport } from './health-indicator.registry';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly registry: HealthIndicatorRegistry) {}

  @Get()
  @Public()
  // Infraestructura técnica, no una operación de dominio: no devuelve Result.
  @SkipResultHttpInterceptor()
  @ApiOperation({ summary: 'Estado del servicio y de sus dependencias' })
  @ApiResponse({ status: 200, description: 'Servicio operativo (`ok`) u operativo sin caché (`degraded`).' })
  @ApiResponse({ status: 503, description: 'Una dependencia crítica (base de datos) no responde.' })
  async check(@Res({ passthrough: true }) response: Response): Promise<HealthReport> {
    const report = await this.registry.run();
    if (report.status === 'error') response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return report;
  }
}
