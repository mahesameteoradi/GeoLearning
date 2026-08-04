import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateLevel,
  xpForLevel,
  xpToNextLevel,
  levelProgressPercent,
} from './constants/level-thresholds';
import { BADGE_RULES, BadgeContext } from './constants/badge-rules';

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface XpContext {
  /** Quiz score (0–100), if this XP comes from a quiz attempt */
  quizScore?: number;
  /** ID of the originating quiz attempt */
  quizAttemptId?: string;
  /** True if this is the user's very first quiz attempt */
  isFirstQuiz?: boolean;
  /** Whether the user is currently in the leaderboard top 10 */
  isTopTen?: boolean;
  /** The source of the XP (e.g. 'quiz', 'badge', 'manual_adjustment', 'project') */
  source?: string;
  /** ID of the reference entity (e.g. quiz attempt ID, project submission ID) */
  referenceId?: string;
}

export interface AwardedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  /** True if the streak value changed from before */
  streakUpdated: boolean;
}

export interface XpResult {
  userId: string;
  previousXp: number;
  newXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  xpToNextLevel: number;
  levelProgressPercent: number;
  streakResult: StreakResult;
  newBadges: AwardedBadge[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  /** Timestamp of the last leaderboard broadcast — used for throttling */
  private lastLeaderboardBroadcast = 0;
  /** Minimum interval between leaderboard broadcasts (ms) */
  private readonly LEADERBOARD_THROTTLE_MS = 30_000; // 30 seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Main entry point — call this after any XP-earning event (quiz completion,
   * daily login, etc.). Orchestrates the full pipeline:
   *   1. Calculate new XP + level
   *   2. Update streak
   *   3. Persist changes to DB
   *   4. Check and award new badges
   *   5. Broadcast achievement_unlocked events via Supabase Realtime
   *   6. Broadcast updated leaderboard to the 'leaderboard' channel
   */
  async awardXP(
    userId: string,
    xpAmount: number,
    context: XpContext = {},
  ): Promise<XpResult> {
    // ── 1. Fetch current user state ─────────────────────────────────────────
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { badges: true },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const previousXp = user.xp;
    const previousLevel = user.level;
    const newXp = previousXp + xpAmount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > previousLevel;

    // ── 2. Compute streak ───────────────────────────────────────────────────
    const streakResult = this.computeStreak(
      user.current_streak,
      user.longest_streak,
      user.updated_at,
    );

    // ── 3. Persist XP, level, streak, and log in one atomic DB update ───────
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
          current_streak: streakResult.currentStreak,
          longest_streak: streakResult.longestStreak,
        },
      }),
      (this.prisma as any).xpLog.create({
        data: {
          user_id: userId,
          amount: xpAmount,
          source:
            context.source ||
            (context.quizAttemptId ? 'quiz' : 'manual_adjustment'),
          reference_id: context.referenceId || context.quizAttemptId || null,
        },
      }),
    ]);

    this.logger.log(
      `[XP] User ${userId}: ${previousXp} → ${newXp} XP | ` +
        `Level ${previousLevel} → ${newLevel}${leveledUp ? ' ⬆ LEVEL UP' : ''}`,
    );

    // ── 4. Check & award badges ─────────────────────────────────────────────
    const existingBadgeIds = user.badges.map((b) => b.badge_id);
    const badgeContext: BadgeContext = {
      xp: newXp,
      level: newLevel,
      currentStreak: streakResult.currentStreak,
      quizScore: context.quizScore,
      isFirstQuiz: context.isFirstQuiz,
      isTopTen: context.isTopTen,
    };

    const newBadges = await this.checkAndAwardBadges(
      userId,
      badgeContext,
      existingBadgeIds,
    );

    // ── 5. Broadcast each new achievement via Supabase Realtime ─────────────
    for (const badge of newBadges) {
      await this.broadcastAchievement(userId, badge);
    }

    // ── 6. Broadcast fresh leaderboard (throttled — max 1 per 30s) ──────────
    const now = Date.now();
    if (now - this.lastLeaderboardBroadcast >= this.LEADERBOARD_THROTTLE_MS) {
      this.lastLeaderboardBroadcast = now;
      void this.broadcastLeaderboard();
    } else {
      this.logger.debug(
        '[Realtime] Leaderboard broadcast throttled — skipping',
      );
    }

    return {
      userId,
      previousXp,
      newXp,
      previousLevel,
      newLevel,
      leveledUp,
      xpToNextLevel: xpToNextLevel(newXp),
      levelProgressPercent: levelProgressPercent(newXp),
      streakResult,
      newBadges,
    };
  }

  /**
   * Sends a motivational boost to a student.
   * Creates a POSITIVE intervention and awards XP.
   */
  async sendBoost(
    teacherId: string,
    studentId: string,
    xpBonus: number,
    note: string,
  ): Promise<any> {
    // 1. Create intervention
    const intervention = await this.prisma.intervention.create({
      data: {
        teacher_id: teacherId,
        student_id: studentId,
        note: note,
        type: 'POSITIVE',
        resolved: true, // Auto-resolved since it's a one-time boost
      },
    });

    // 2. Award XP
    const xpResult = await this.awardXP(studentId, xpBonus);

    // 3. Create notification for student
    await this.prisma.notification.create({
      data: {
        user_id: studentId,
        message: `Boost Motivasi dari Guru: ${note} (+${xpBonus} XP)`,
        type: 'INTERVENTION',
      },
    });

    return {
      intervention,
      xpResult,
    };
  }

  /**
   * Grades a project submission and awards calculated XP.
   */
  async gradeProject(
    teacherId: string,
    submissionId: string,
    score: number,
    feedback?: string,
  ): Promise<any> {
    const submission = await this.prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission)
      throw new NotFoundException('Project submission not found');

    const totalXpEarned = Math.round(
      submission.assignment.xp_reward * (score / 100),
    );

    // For group projects, divide XP by the number of members
    let xpEarned = totalXpEarned;
    let groupMembers: string[] = [];
    if (submission.assignment.is_group_project && submission.group_members) {
      try {
        const members = Array.isArray(submission.group_members)
          ? submission.group_members
          : JSON.parse(submission.group_members as string);

        if (Array.isArray(members) && members.length > 0) {
          groupMembers = members;
          xpEarned = Math.round(totalXpEarned / members.length);
        }
      } catch (e) {
        this.logger.error('Failed to parse group_members', e);
      }
    }

    await this.prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        xp_earned: xpEarned,
        graded_at: new Date(),
      },
    });

    let xpResult: any = null;
    if (xpEarned > 0) {
      if (groupMembers.length > 0) {
        // Award XP to all group members
        const results = await Promise.all(
          groupMembers.map((memberId) =>
            this.awardXP(memberId, xpEarned, {
              source: 'project',
              referenceId: submissionId,
            }),
          ),
        );
        // We just return the submitter's result or the first one for backwards compatibility
        xpResult =
          results.find((r) => r.userId === submission.user_id) || results[0];
      } else {
        // Single user project
        xpResult = await this.awardXP(submission.user_id, xpEarned, {
          source: 'project',
          referenceId: submissionId,
        });
      }

      // Create notification
      const message = `Tugas Proyek "${submission.assignment.title}" telah dinilai! Anda mendapatkan skor ${score} dan +${xpEarned} XP.`;
      if (groupMembers.length > 0) {
        await Promise.all(
          groupMembers.map((memberId) =>
            this.prisma.notification.create({
              data: {
                user_id: memberId,
                message,
                type: 'ACHIEVEMENT',
              },
            }),
          ),
        );
      } else {
        await this.prisma.notification.create({
          data: {
            user_id: submission.user_id,
            message,
            type: 'ACHIEVEMENT',
          },
        });
      }
    }

    return {
      submissionId,
      score,
      xpEarned,
      xpResult,
    };
  }

  /**
   * Evaluates all badge rules against the current user context.
   * Inserts any newly qualified badges and returns them.
   */
  async checkAndAwardBadges(
    userId: string,
    context: BadgeContext,
    existingBadgeIds: string[],
  ): Promise<AwardedBadge[]> {
    // Filter rules that qualify and haven't been awarded yet
    const qualifiedRules = BADGE_RULES.filter(
      (rule) => !existingBadgeIds.includes(rule.id) && rule.evaluate(context),
    );

    if (qualifiedRules.length === 0) return [];

    // Insert all newly earned badges in parallel
    const results = await Promise.allSettled(
      qualifiedRules.map((rule) =>
        this.prisma.userBadge
          .create({ data: { user_id: userId, badge_id: rule.id } })
          .then(() => rule),
      ),
    );

    const awarded: AwardedBadge[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const rule = result.value;
        awarded.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          icon: rule.icon,
          earnedAt: new Date(),
        });
        this.logger.log(
          `[Badge] ${rule.icon} "${rule.name}" awarded to user ${userId}`,
        );
      } else {
        // Log but don't fail — badge may already exist (race condition)
        this.logger.warn(
          `[Badge] Insert failed (likely duplicate): ${String(result.reason)}`,
        );
      }
    }

    return awarded;
  }

  /**
   * Broadcasts an 'achievement_unlocked' event to a user's private channel
   * using the Supabase Realtime REST Broadcast API.
   *
   * The frontend subscribes to channel `user:{userId}` to receive these events.
   * Uses the Service Role key — never exposed to clients.
   */
  async broadcastAchievement(
    userId: string,
    badge: AwardedBadge,
  ): Promise<void> {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    try {
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
              topic: `user:${userId}`,
              event: 'achievement_unlocked',
              payload: badge,
            },
          ],
        }),
      });

      if (!res.ok) {
        this.logger.warn(
          `[Realtime] Achievement broadcast failed for user ${userId} — HTTP ${res.status}`,
        );
      } else {
        this.logger.log(
          `[Realtime] achievement_unlocked → user:${userId} — ${badge.icon} ${badge.name}`,
        );
      }
    } catch (err) {
      this.logger.error(`[Realtime] Broadcast error for user ${userId}:`, err);
    }
  }

  /**
   * Fetches the top 10 users by XP and broadcasts them to the public
   * 'leaderboard' Supabase Realtime channel.
   *
   * The frontend subscribes to channel 'leaderboard' to reactively update
   * the leaderboard UI without polling.
   */
  async broadcastLeaderboard(): Promise<void> {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    try {
      const topTen = await this.prisma.user.findMany({
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

      const leaderboard = topTen.map((u, i) => ({ rank: i + 1, ...u }));

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
                entries: leaderboard,
                updatedAt: new Date().toISOString(),
              },
            },
          ],
        }),
      });

      if (!res.ok) {
        this.logger.warn(
          `[Realtime] Leaderboard broadcast failed — HTTP ${res.status}`,
        );
      } else {
        this.logger.log('[Realtime] leaderboard_updated broadcast sent');
      }
    } catch (err) {
      this.logger.error('[Realtime] Leaderboard broadcast error:', err);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PURE / HELPER METHODS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Returns the complete gamification profile for a user:
   * XP, level, streak, badges, and progress to the next level.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        xp: true,
        level: true,
        current_streak: true,
        longest_streak: true,
        avatar_url: true,
        equipped_badge_id: true,
        badges: {
          orderBy: { earned_at: 'desc' },
          select: {
            id: true,
            badge_id: true,
            earned_at: true,
            badge: {
              select: {
                display_name: true,
                description: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    return {
      ...user,
      xpToNextLevel: xpToNextLevel(user.xp),
      levelProgressPercent: levelProgressPercent(user.xp),
    };
  }

  /**
   * Pure function: computes the new streak values without touching the DB.
   * Comparison is calendar-day-based (not timestamp-based).
   *
   * - Same calendar day  → streak unchanged
   * - Next calendar day  → streak incremented
   * - Gap > 1 day        → streak reset to 1
   */
  computeStreak(
    currentStreak: number,
    longestStreak: number,
    lastUpdatedAt: Date,
  ): StreakResult {
    const now = new Date();
    const last = new Date(lastUpdatedAt);

    const toDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    const dayDiff = Math.round((toDay(now) - toDay(last)) / 86_400_000);

    let newStreak: number;
    let streakUpdated = false;

    if (dayDiff === 0) {
      newStreak = currentStreak; // Same day — no change
    } else if (dayDiff === 1) {
      newStreak = currentStreak + 1; // Consecutive day — increment
      streakUpdated = true;
    } else {
      newStreak = 1; // Gap — reset
      streakUpdated = true;
    }

    return {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, longestStreak),
      streakUpdated,
    };
  }
}
