import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@almo/prisma';
import { TransactionManagerPort, type TransactionOptions } from './transaction-manager.port';

/** Adaptador interno: no se exporta, para que nadie se salte el puerto. */
@Injectable()
export class PrismaTransactionManager extends TransactionManagerPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  run<T>(fn: () => Promise<T>, opts?: TransactionOptions): Promise<T> {
    return this.prisma.runInTransaction(fn, opts);
  }
}
