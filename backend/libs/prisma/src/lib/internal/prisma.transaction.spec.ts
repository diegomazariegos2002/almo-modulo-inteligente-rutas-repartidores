import { DEFAULT_TRANSACTION_OPTIONS, runInTransaction, txStore, type TransactionStarter } from './prisma.transaction';
import type { TransactionClient } from './prisma.types';

describe('runInTransaction', () => {
  const tx = { marca: 'tx' } as unknown as TransactionClient;
  let prisma: jest.Mocked<TransactionStarter>;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((fn: (cliente: TransactionClient) => Promise<unknown>) => fn(tx)),
    } as unknown as jest.Mocked<TransactionStarter>;
  });

  it('abre una transacción y expone su cliente al flujo asíncrono', async () => {
    const visto = await runInTransaction(prisma, async () => {
      await Promise.resolve();
      return txStore.getStore();
    });

    expect(visto).toBe(tx);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), DEFAULT_TRANSACTION_OPTIONS);
  });

  it('no deja la transacción activa al terminar', async () => {
    await runInTransaction(prisma, async () => undefined);

    expect(txStore.getStore()).toBeUndefined();
  });

  it('reutiliza la transacción activa en una llamada anidada', async () => {
    const interno = await runInTransaction(prisma, () => runInTransaction(prisma, async () => txStore.getStore()));

    expect(interno).toBe(tx);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('respeta los tiempos indicados por quien llama', async () => {
    await runInTransaction(prisma, async () => undefined, { timeout: 500 });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      maxWait: DEFAULT_TRANSACTION_OPTIONS.maxWait,
      timeout: 500,
    });
  });

  it('propaga el error para que Prisma revierta la transacción', async () => {
    await expect(
      runInTransaction(prisma, async () => {
        throw new Error('falló');
      }),
    ).rejects.toThrow('falló');
  });
});
