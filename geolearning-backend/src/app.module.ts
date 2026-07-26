import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { GamificationModule } from './gamification/gamification.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Load environment variables globally from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Global: Prisma DB access (available to all modules)
    PrismaModule,

    // Global: Supabase client + Auth JWT verification
    SupabaseModule,

    // Global: JWT guard via APP_GUARD — all routes protected unless @Public()
    AuthModule,

    // Feature: XP, leveling, streaks, badges, Realtime broadcasts
    GamificationModule,

    // Feature: Top-10 leaderboard + Realtime leaderboard channel
    LeaderboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
