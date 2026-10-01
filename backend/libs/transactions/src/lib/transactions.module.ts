import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@almo/prisma';
import { PrismaTransactionManager } from './prisma-transaction-manager.adapter';
import { TransactionManagerPort } from './transaction-manager.port';

/** Global: se importa una sola vez en el AppModule. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [{ provide: TransactionManagerPort, useClass: PrismaTransactionManager }],
  exports: [TransactionManagerPort],
})
export class TransactionsModule {}
