import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { PrismaClient } from './generated/client';
import { buildClient } from './internal/prisma.client';
import { runInTransaction, txStore } from './internal/prisma.transaction';
import type { TransactionOptions } from './internal/prisma.types';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = buildClient(process.env['DATABASE_URL'] ?? '');
  }

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
    this.logger.log('Conectado a PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }

  /**
   * Cliente que deben usar SIEMPRE los repositorios.
   *
   * Devuelve el cliente de la transacción activa si la hay, o el cliente
   * principal si no: el mismo repositorio funciona dentro y fuera de una transacción.
   */
  get client(): PrismaClient {
    return (txStore.getStore() ?? this.prisma) as PrismaClient;
  }

  runInTransaction<T>(fn: () => Promise<T>, options?: TransactionOptions): Promise<T> {
    return runInTransaction(this.prisma, fn, options);
  }

  /** Comprobación de vida para `/health`. */
  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
