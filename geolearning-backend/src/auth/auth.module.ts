import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './auth.guard';

/**
 * AuthModule
 *
 * Registers SupabaseAuthGuard as a global guard via APP_GUARD.
 * This means every route is protected by default.
 * Use @Public() on routes that should be accessible without a token.
 */
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AuthModule {}
