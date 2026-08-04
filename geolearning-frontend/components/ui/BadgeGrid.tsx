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
export const ALL_BADGES: BadgeData[] = [
  { id: 'first_quiz',    icon: '🎯', display_name: 'First Steps',     description: 'Telah menyelesaikan kuis pertama' },
  { id: 'perfect_score', icon: '💯', display_name: 'Perfectionist',   description: 'Mendapatkan skor 100% pada kuis' },
  { id: 'xp_100',        icon: '⭐', display_name: 'Getting Started', description: 'Berhasil mengumpulkan 100 XP' },
  { id: 'xp_500',        icon: '🌟', display_name: 'Rising Star',     description: 'Berhasil mengumpulkan 500 XP' },
  { id: 'xp_1000',       icon: '💫', display_name: 'XP Machine',      description: 'Berhasil mengumpulkan 1.000 XP' },
  { id: 'xp_5000',       icon: '🔮', display_name: 'Veteran',         description: 'Berhasil mengumpulkan 5.000 XP' },
  { id: 'level_5',       icon: '🔥', display_name: 'Apprentice',      description: 'Telah mencapai Level 5' },
  { id: 'level_10',      icon: '📚', display_name: 'Scholar',         description: 'Telah mencapai Level 10' },
  { id: 'level_20',      icon: '🏆', display_name: 'Expert',          description: 'Telah mencapai Level 20' },
  { id: 'level_50',      icon: '👑', display_name: 'Master',          description: 'Telah mencapai Level 50' },
  { id: 'streak_3',      icon: '🔥', display_name: 'On a Roll',       description: 'Belajar 3 hari berturut-turut' },
  { id: 'streak_7',      icon: '⚡', display_name: 'Week Warrior',    description: 'Belajar 7 hari berturut-turut' },
  { id: 'streak_30',     icon: '🌈', display_name: 'Unstoppable',     description: 'Belajar 30 hari berturut-turut' },
  { id: 'top_10',        icon: '🥇', display_name: 'Elite',           description: 'Masuk dalam peringkat 10 besar' },
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
                ? 'cursor-pointer border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:-translate-y-1 hover:shadow-md hover:z-10'
                : 'cursor-default border border-slate-200 bg-white opacity-40 grayscale'
            )}
          >
            {/* Equipped indicator dot */}
            {isEquipped && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#0F0F1A]" />
            )}

            <span className={cn('flex items-center justify-center text-xl leading-none w-8 h-8', !isEarned && 'saturate-0 opacity-50')}>
              {badge.icon.startsWith('http') || badge.icon.startsWith('data:image') ? (
                <img src={badge.icon} alt={badge.display_name} className="w-full h-full object-contain" />
              ) : (
                badge.icon
              )}
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
