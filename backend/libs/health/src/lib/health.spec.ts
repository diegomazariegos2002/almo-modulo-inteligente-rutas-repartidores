import type { Response } from 'express';
import { HealthController } from './health.controller';
import { HealthIndicatorRegistry } from './health-indicator.registry';

const responde = (): Promise<void> => Promise.resolve();
const noResponde = (): Promise<void> => Promise.reject(new Error('sin conexión'));

describe('HealthIndicatorRegistry', () => {
  let registry: HealthIndicatorRegistry;

  beforeEach(() => {
    registry = new HealthIndicatorRegistry();
  });

  it('reporta ok cuando todas las dependencias responden', async () => {
    registry.register({ name: 'database', critical: true, check: responde });
    registry.register({ name: 'cache', critical: false, check: responde });

    await expect(registry.run()).resolves.toEqual({ status: 'ok', checks: { database: 'up', cache: 'up' } });
  });

  it('reporta degraded si solo cae una dependencia no crítica', async () => {
    registry.register({ name: 'database', critical: true, check: responde });
    registry.register({ name: 'cache', critical: false, check: noResponde });

    await expect(registry.run()).resolves.toEqual({ status: 'degraded', checks: { database: 'up', cache: 'down' } });
  });

  it('reporta error si cae una dependencia crítica', async () => {
    registry.register({ name: 'database', critical: true, check: noResponde });
    registry.register({ name: 'cache', critical: false, check: responde });

    await expect(registry.run()).resolves.toEqual({ status: 'error', checks: { database: 'down', cache: 'up' } });
  });

  it('sin indicadores registrados el servicio está ok', async () => {
    await expect(registry.run()).resolves.toEqual({ status: 'ok', checks: {} });
  });
});

describe('HealthController', () => {
  const status = jest.fn();
  const response = { status } as unknown as Response;

  beforeEach(() => status.mockClear());

  it('responde 200 mientras la base de datos esté arriba', async () => {
    const registry = new HealthIndicatorRegistry();
    registry.register({ name: 'database', critical: true, check: responde });
    registry.register({ name: 'cache', critical: false, check: noResponde });

    const report = await new HealthController(registry).check(response);

    expect(report.status).toBe('degraded');
    expect(status).not.toHaveBeenCalled();
  });

  it('responde 503 si la base de datos no responde', async () => {
    const registry = new HealthIndicatorRegistry();
    registry.register({ name: 'database', critical: true, check: noResponde });

    const report = await new HealthController(registry).check(response);

    expect(report.status).toBe('error');
    expect(status).toHaveBeenCalledWith(503);
  });
});
