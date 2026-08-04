import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  xp: number;
  level: number;
  avatar_url: string | null;
  equipped_badge_id: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Fetches the top 10 users ordered by XP (descending).
   * Returns shaped entries with 1-based rank numbers.
   *
   * Used for:
   *   - Initial page load (REST GET /leaderboard)
   *   - Internal calls from broadcastLeaderboard()
   */
  async getTopTen(): Promise<LeaderboardEntry[]> {
    const users = await this.prisma.user.findMany({
      take: 10,
      orderBy: { xp: 'desc' },
      select: {
        id: true,
        name: true,
        xp: true,
        level: true,
        avatar_url: true,
        equipped_badge_id: true,
      },
    });

    return users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));
  }

  /**
   * Fetches the current top-10 and broadcasts the result to the public
   * 'leaderboard' Supabase Realtime channel via the REST Broadcast API.
   *
   * Frontend Realtime subscription (JavaScript):
   * ─────────────────────────────────────────────
   * const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
   *
   * supabase
   *   .channel('leaderboard')
   *   .on('broadcast', { event: 'leaderboard_updated' }, ({ payload }) => {
   *     console.log('New leaderboard:', payload.entries)
   *   })
   *   .subscribe()
   * ─────────────────────────────────────────────
   *
   * The frontend receives updates whenever GamificationService calls this
   * method after awarding XP — no polling required.
   */
  async broadcastLeaderboard(): Promise<void> {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    try {
      const entries = await this.getTopTen();

      const res = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({
          messages: [
            {
              topic: 'leaderboard',
              event: 'leaderboard_updated',
              payload: {
                entries,
                updatedAt: new Date().toISOString(),
              },
            },
          ],
        }),
      });

      if (!res.ok) {
        this.logger.warn(
          `[Realtime] Leaderboard broadcast failed — HTTP ${res.status}: ${await res.text()}`,
        );
      } else {
        this.logger.log(
          `[Realtime] leaderboard_updated → ${entries.length} entries broadcast`,
        );
      }
    } catch (err) {
      this.logger.error('[Realtime] Leaderboard broadcast error:', err);
    }
  }

  /**
   * Returns the rank of a specific user in the leaderboard (1-indexed).
   * Returns null if the user is not in the top 10.
   */
  async getUserRank(userId: string): Promise<number | null> {
    const entries = await this.getTopTen();
    const entry = entries.find((e) => e.id === userId);
    return entry?.rank ?? null;
  }
}
