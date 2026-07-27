import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * AuthModule
 *
 * Registers SupabaseAuthGuard as a global guard via APP_GUARD.
 * This means every route is protected by default.
 * Use @Public() on routes that should be accessible without a token.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AuthModule {}
