import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService
 *
 * Wraps PrismaClient using the @prisma/adapter-pg driver adapter,
 * which is required by Prisma v7's "client" engine type.
 *
 * Connection is established using the DATABASE_URL environment variable.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
          'Please configure it in your .env file.',
      );
    }

    // Prisma v7 requires a Driver Adapter for database connections.
    // PrismaPg wraps the 'pg' (node-postgres) driver for PostgreSQL / Supabase.
    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Prisma connected to Supabase PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Prisma disconnected from database');
  }
}
