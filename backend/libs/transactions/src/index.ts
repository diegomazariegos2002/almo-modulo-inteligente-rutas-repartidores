export { TransactionManagerPort } from './lib/transaction-manager.port';
export type { TransactionOptions } from './lib/transaction-manager.port';
export { TransactionsModule } from './lib/transactions.module';
export { runAtomic } from './lib/run-atomic';
// PrismaTransactionManager no se exporta a propósito: es un detalle interno.
