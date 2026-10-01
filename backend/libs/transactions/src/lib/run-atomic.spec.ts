import { err, isErr, isOk, ok } from '@almo/result';
import { runAtomic } from './run-atomic';
import { TransactionManagerPort } from './transaction-manager.port';

/** Gestor falso que registra si la "transacción" terminó en commit o en rollback. */
class TxManagerFalso extends TransactionManagerPort {
  desenlace: 'commit' | 'rollback' | null = null;

  async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const valor = await fn();
      this.desenlace = 'commit';
      return valor;
    } catch (error) {
      this.desenlace = 'rollback';
      throw error;
    }
  }
}

describe('runAtomic', () => {
  let tx: TxManagerFalso;

  beforeEach(() => {
    tx = new TxManagerFalso();
  });

  it('confirma la transacción y devuelve el ok', async () => {
    const resultado = await runAtomic(tx, async () => ok('hecho'));

    expect(isOk(resultado) && resultado.value).toBe('hecho');
    expect(tx.desenlace).toBe('commit');
  });

  it('revierte la transacción cuando el callback devuelve err, y entrega ese mismo err', async () => {
    const fallo = err(new Error('regla de negocio'));

    const resultado = await runAtomic(tx, async () => fallo);

    expect(resultado).toBe(fallo);
    expect(isErr(resultado)).toBe(true);
    expect(tx.desenlace).toBe('rollback');
  });

  it('revierte y relanza una excepción inesperada', async () => {
    await expect(
      runAtomic(tx, async () => {
        throw new Error('se cayó la conexión');
      }),
    ).rejects.toThrow('se cayó la conexión');
    expect(tx.desenlace).toBe('rollback');
  });

  it('pasa las opciones al gestor de transacciones', async () => {
    const run = jest.spyOn(tx, 'run');

    await runAtomic(tx, async () => ok(1), { timeout: 2000 });

    expect(run).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 });
  });
});
