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
    this.isDestroyed = true;
    if (this.supabase) {
      this.supabase.removeAllChannels();
    }
  }

  private retryCount = 0;
  private maxRetries = 5;

  private isDestroyed = false;

  private startListening() {
    if (this.isDestroyed) return;
    this.logger.log('Started listening to Supabase Realtime for Users table changes...');

    const channelName = `gamification_users_listener_${Date.now()}`;
    const channel = this.supabase
      .channel(channelName)
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
      .subscribe(async (status, err) => {
        if (this.isDestroyed) {
            await this.supabase.removeChannel(channel);
            return;
        }
        if (status === 'SUBSCRIBED') {
          this.logger.log('Successfully subscribed to Users table updates');
          this.retryCount = 0; // Reset on success
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || err) {
          this.logger.error(`Realtime subscription failed with status: ${status}`, err);
          
          if (this.retryCount < this.maxRetries) {
            const delay = Math.pow(2, this.retryCount) * 1000;
            this.retryCount++;
            this.logger.warn(`Reconnecting in ${delay}ms (Attempt ${this.retryCount} of ${this.maxRetries})...`);
            
            // Remove old channel before recreating
            await this.supabase.removeChannel(channel);
            
            setTimeout(() => this.startListening(), delay);
          } else {
            this.logger.error('Max reconnection retries reached. Realtime listener is offline.');
          }
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
