import { cn } from '@/lib/utils/cn'

interface BadgeData {
  id: string
  display_name: string
  description: string
  icon: string
  earned_at?: string
}

interface BadgeGridProps {
  earned: BadgeData[]
  equippedId?: string | null
  className?: string
  compact?: boolean
}

// All possible badges — greyed out if not earned
const ALL_BADGES: BadgeData[] = [
  { id: 'first_quiz',    icon: '🎯', display_name: 'First Steps',     description: 'Completed your very first quiz' },
  { id: 'perfect_score', icon: '💯', display_name: 'Perfectionist',   description: 'Scored 100% on a quiz' },
  { id: 'xp_100',        icon: '⭐', display_name: 'Getting Started', description: 'Earned 100 XP total' },
  { id: 'xp_500',        icon: '🌟', display_name: 'Rising Star',     description: 'Earned 500 XP total' },
  { id: 'xp_1000',       icon: '💫', display_name: 'XP Machine',      description: 'Earned 1,000 XP total' },
  { id: 'xp_5000',       icon: '🔮', display_name: 'Veteran',         description: 'Earned 5,000 XP total' },
  { id: 'level_5',       icon: '🔥', display_name: 'Apprentice',      description: 'Reached Level 5' },
  { id: 'level_10',      icon: '📚', display_name: 'Scholar',         description: 'Reached Level 10' },
  { id: 'level_20',      icon: '🏆', display_name: 'Expert',          description: 'Reached Level 20' },
  { id: 'level_50',      icon: '👑', display_name: 'Master',          description: 'Reached Level 50' },
  { id: 'streak_3',      icon: '🔥', display_name: 'On a Roll',       description: '3-day learning streak' },
  { id: 'streak_7',      icon: '⚡', display_name: 'Week Warrior',    description: '7-day learning streak' },
  { id: 'streak_30',     icon: '🌈', display_name: 'Unstoppable',     description: '30-day learning streak' },
  { id: 'top_10',        icon: '🥇', display_name: 'Elite',           description: 'Ranked in the Top 10' },
]

export function BadgeGrid({ earned, equippedId, className, compact = false }: BadgeGridProps) {
  const earnedIds = new Set(earned.map((b) => b.id))

  return (
    <div
      className={cn(
        'grid gap-2.5',
        compact ? 'grid-cols-5 sm:grid-cols-7' : 'grid-cols-4 sm:grid-cols-7',
        className
      )}
    >
      {ALL_BADGES.map((badge) => {
        const isEarned = earnedIds.has(badge.id)
        const isEquipped = badge.id === equippedId

        return (
          <div
            key={badge.id}
            title={`${badge.display_name}: ${badge.description}`}
            className={cn(
              // No scale transform — use border-color change instead (no composite layer)
              'group relative flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all duration-300',
              isEarned
                ? 'cursor-pointer border border-slate-200 bg-slate-100 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:-translate-y-1 hover:shadow-md hover:z-10'
                : 'cursor-default border border-white/[0.04] bg-transparent opacity-25 grayscale'
            )}
          >
            {/* Equipped indicator dot */}
            {isEquipped && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#0F0F1A]" />
            )}

            <span className={cn('text-xl leading-none', !isEarned && 'saturate-0')}>
              {badge.icon}
            </span>

            {!compact && (
              <span className="text-center text-[9px] font-medium leading-tight text-slate-500 w-full truncate px-0.5">
                {badge.display_name}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
