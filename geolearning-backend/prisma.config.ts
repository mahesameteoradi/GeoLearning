// Prisma v7 configuration
// NOTE: In Prisma v7, `url` here is used by the CLI (prisma migrate, db push).
// For Supabase, CLI needs the DIRECT connection (bypasses PgBouncer).
// The app runtime uses DATABASE_URL (PgBouncer pooler) via PrismaClient constructor.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // DIRECT_URL — bypasses PgBouncer, required for Prisma CLI migrations
    url: process.env['DIRECT_URL'],
  },
});
