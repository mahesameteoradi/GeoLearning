import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GamificationService } from './gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import { BADGE_RULES } from './constants/badge-rules';

@Injectable()
export class GamificationListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GamificationListenerService.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly gamificationService: GamificationService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.startListening();
  }

  onModuleDestroy() {
    if (this.supabase) {
      this.supabase.removeAllChannels();
    }
  }

  private startListening() {
    this.logger.log('Started listening to Supabase Realtime for Users table changes...');

    this.supabase
      .channel('gamification_users_listener')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        async (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;

          // Only trigger if XP changed and increased
          if (newRecord.xp > (oldRecord.xp || 0)) {
            await this.handleXpUpdate(newRecord);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          this.logger.log('Successfully subscribed to Users table updates');
        } else if (err) {
          this.logger.error('Failed to subscribe to Users table updates', err);
        }
      });
  }

  private async handleXpUpdate(userRecord: any) {
    try {
      this.logger.debug(`Detected XP increase for user ${userRecord.id}: ${userRecord.xp} XP`);

      // 1. Fetch user's existing badges
      const userBadges = await this.prisma.userBadge.findMany({
        where: { user_id: userRecord.id },
        select: { badge_id: true }
      });
      const existingBadgeIds = userBadges.map(b => b.badge_id);

      // 2. Prepare context for evaluation
      const badgeContext = {
        xp: userRecord.xp,
        level: userRecord.level,
        currentStreak: userRecord.current_streak,
      };

      // 3. Evaluate and award badges using GamificationService logic
      const newBadges = await this.gamificationService.checkAndAwardBadges(
        userRecord.id,
        badgeContext,
        existingBadgeIds
      );

      // 4. Broadcast unlocked badges
      for (const badge of newBadges) {
        await this.gamificationService.broadcastAchievement(userRecord.id, badge);
      }
    } catch (err) {
      this.logger.error(`Error processing XP update for user ${userRecord.id}`, err);
    }
  }
}
