import type { PrismaService } from '@almo/prisma';
import { PrismaTransactionManager } from './prisma-transaction-manager.adapter';

describe('PrismaTransactionManager', () => {
  it('delega en PrismaService.runInTransaction con las mismas opciones', async () => {
    const runInTransaction = jest.fn((fn: () => Promise<unknown>) => fn());
    const manager = new PrismaTransactionManager({ runInTransaction } as unknown as PrismaService);
    const trabajo = jest.fn().mockResolvedValue('hecho');

    const resultado = await manager.run(trabajo, { timeout: 1000 });

    expect(resultado).toBe('hecho');
    expect(runInTransaction).toHaveBeenCalledWith(trabajo, { timeout: 1000 });
  });

  it('propaga el error del callback', async () => {
    const runInTransaction = jest.fn((fn: () => Promise<unknown>) => fn());
    const manager = new PrismaTransactionManager({ runInTransaction } as unknown as PrismaService);

    await expect(manager.run(() => Promise.reject(new Error('falló')))).rejects.toThrow('falló');
  });
});
