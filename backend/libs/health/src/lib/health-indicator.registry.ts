import { Injectable } from '@nestjs/common';

export type EstadoIndicador = 'up' | 'down';

export interface HealthIndicator {
  /** Nombre con el que aparece en la respuesta (`database`, `cache`). */
  name: string;
  /** Debe resolver si la dependencia responde y rechazar si no. */
  check: () => Promise<void>;
  /** Si es crítica, su caída deja al servicio fuera de servicio (503). */
  critical: boolean;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error';
  checks: Record<string, EstadoIndicador>;
}

/** Cada módulo de infraestructura registra aquí cómo comprobar su dependencia. */
@Injectable()
export class HealthIndicatorRegistry {
  private readonly indicators: HealthIndicator[] = [];

  register(indicator: HealthIndicator): void {
    this.indicators.push(indicator);
  }

  async run(): Promise<HealthReport> {
    const estados = await Promise.all(
      this.indicators.map(async (indicator): Promise<EstadoIndicador> => {
        try {
          await indicator.check();
          return 'up';
        } catch {
          return 'down';
        }
      }),
    );

    const checks: Record<string, EstadoIndicador> = {};
    let caidaCritica = false;
    let algunaCaida = false;

    this.indicators.forEach((indicator, i) => {
      const estado = estados[i] ?? 'down';
      checks[indicator.name] = estado;
      if (estado === 'down') {
        algunaCaida = true;
        if (indicator.critical) caidaCritica = true;
      }
    });

    const status = caidaCritica ? 'error' : algunaCaida ? 'degraded' : 'ok';
    return { status, checks };
  }
}
