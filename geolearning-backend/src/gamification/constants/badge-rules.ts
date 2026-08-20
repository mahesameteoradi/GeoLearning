/**
 * Badge Rules — Gamification Achievement Definitions
 *
 * Each rule has a pure `evaluate()` function that receives
 * a BadgeContext snapshot and returns true if the badge should
 * be awarded. The GamificationService evaluates all rules after
 * each XP update and persists newly earned badges.
 */

export interface BadgeContext {
  /** User's total XP after the current update */
  xp: number;
  /** User's level after the current update */
  level: number;
  /** User's current active streak (in days) */
  currentStreak: number;
  /** Score on the triggering quiz attempt (0–100), if applicable */
  quizScore?: number;
  /** True if this is the user's first ever quiz attempt */
  isFirstQuiz?: boolean;
  /** True if the user currently appears in the leaderboard top 10 */
  isTopTen?: boolean;
}

export interface BadgeDefinition {
  /** Unique badge identifier — stored as badge_name in UserBadge table */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Short description shown in UI */
  description: string;
  /** Emoji icon for the badge */
  icon: string;
  /** Pure function: returns true if the user qualifies for this badge */
  evaluate: (context: BadgeContext) => boolean;
}

export const BADGE_RULES: BadgeDefinition[] = [
  // ─── Milestone: First Quiz ──────────────────────────────────────────────
  {
    id: 'first_quiz',
    name: 'Langkah Pertama',
    description: 'Menyelesaikan kuis pertama kamu',
    icon: '🎯',
    evaluate: (ctx) => ctx.isFirstQuiz === true,
  },

  // ─── Milestone: Perfect Score ───────────────────────────────────────────
  {
    id: 'perfect_score',
    name: 'Si Paling Sempurna',
    description: 'Mendapatkan nilai 100% pada sebuah kuis',
    icon: '💯',
    evaluate: (ctx) => ctx.quizScore === 100,
  },

  // ─── Milestone: XP Totals ───────────────────────────────────────────────
  {
    id: 'xp_100',
    name: 'Mulai Berkembang',
    description: 'Mendapatkan total 100 XP',
    icon: '⭐',
    evaluate: (ctx) => ctx.xp >= 100,
  },
  {
    id: 'xp_500',
    name: 'Bintang Baru',
    description: 'Mendapatkan total 500 XP',
    icon: '🌟',
    evaluate: (ctx) => ctx.xp >= 500,
  },
  {
    id: 'xp_1000',
    name: 'Mesin XP',
    description: 'Mendapatkan total 1.000 XP',
    icon: '💫',
    evaluate: (ctx) => ctx.xp >= 1000,
  },
  {
    id: 'xp_5000',
    name: 'Veteran',
    description: 'Mendapatkan total 5.000 XP',
    icon: '🔮',
    evaluate: (ctx) => ctx.xp >= 5000,
  },

  // ─── Milestone: Level Reached ───────────────────────────────────────────
  {
    id: 'level_5',
    name: 'Pelajar',
    description: 'Mencapai Level 5',
    icon: '🔥',
    evaluate: (ctx) => ctx.level >= 5,
  },
  {
    id: 'level_10',
    name: 'Sarjana',
    description: 'Mencapai Level 10',
    icon: '📚',
    evaluate: (ctx) => ctx.level >= 10,
  },
  {
    id: 'level_20',
    name: 'Ahli',
    description: 'Mencapai Level 20',
    icon: '🏆',
    evaluate: (ctx) => ctx.level >= 20,
  },
  {
    id: 'level_50',
    name: 'Master',
    description: 'Mencapai Level 50',
    icon: '👑',
    evaluate: (ctx) => ctx.level >= 50,
  },

  // ─── Milestone: Daily Streak ─────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'Makin Lancar',
    description: 'Belajar 3 hari berturut-turut',
    icon: '🔥',
    evaluate: (ctx) => ctx.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Pejuang Mingguan',
    description: 'Belajar 7 hari berturut-turut',
    icon: '⚡',
    evaluate: (ctx) => ctx.currentStreak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Tak Terhentikan',
    description: 'Belajar 30 hari berturut-turut',
    icon: '🌈',
    evaluate: (ctx) => ctx.currentStreak >= 30,
  },

  // ─── Milestone: Leaderboard ─────────────────────────────────────────────
  {
    id: 'top_10',
    name: 'Elit',
    description: 'Masuk 10 besar papan peringkat',
    icon: '🥇',
    evaluate: (ctx) => ctx.isTopTen === true,
  },
];
