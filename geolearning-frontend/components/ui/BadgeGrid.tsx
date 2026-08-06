import { cn } from '@/lib/utils/cn'

interface BadgeData {
  id: string
  display_name: string
  description: string
  icon: string
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond'
  earned_at?: string
}

interface BadgeGridProps {
  earned: BadgeData[]
  equippedId?: string | null
  className?: string
  compact?: boolean
}

// All possible badges — assigned with tiers
export const ALL_BADGES: BadgeData[] = [
  { id: 'first_quiz',    icon: '🎯', tier: 'bronze',  display_name: 'First Steps',     description: 'Telah menyelesaikan kuis pertama' },
  { id: 'xp_100',        icon: '⭐', tier: 'bronze',  display_name: 'Getting Started', description: 'Berhasil mengumpulkan 100 XP' },
  { id: 'level_5',       icon: '🔥', tier: 'bronze',  display_name: 'Apprentice',      description: 'Telah mencapai Level 5' },
  { id: 'streak_3',      icon: '🔥', tier: 'bronze',  display_name: 'On a Roll',       description: 'Belajar 3 hari berturut-turut' },
  
  { id: 'xp_500',        icon: '🌟', tier: 'silver',  display_name: 'Rising Star',     description: 'Berhasil mengumpulkan 500 XP' },
  { id: 'level_10',      icon: '📚', tier: 'silver',  display_name: 'Scholar',         description: 'Telah mencapai Level 10' },
  { id: 'streak_7',      icon: '⚡', tier: 'silver',  display_name: 'Week Warrior',    description: 'Belajar 7 hari berturut-turut' },

  { id: 'perfect_score', icon: '💯', tier: 'gold',    display_name: 'Perfectionist',   description: 'Mendapatkan skor 100% pada kuis' },
  { id: 'xp_1000',       icon: '💫', tier: 'gold',    display_name: 'XP Machine',      description: 'Berhasil mengumpulkan 1.000 XP' },
  { id: 'level_20',      icon: '🏆', tier: 'gold',    display_name: 'Expert',          description: 'Telah mencapai Level 20' },
  { id: 'streak_30',     icon: '🌈', tier: 'gold',    display_name: 'Unstoppable',     description: 'Belajar 30 hari berturut-turut' },

  { id: 'xp_5000',       icon: '🔮', tier: 'diamond', display_name: 'Veteran',         description: 'Berhasil mengumpulkan 5.000 XP' },
  { id: 'level_50',      icon: '👑', tier: 'diamond', display_name: 'Master',          description: 'Telah mencapai Level 50' },
  { id: 'top_10',        icon: '🥇', tier: 'diamond', display_name: 'Elite',           description: 'Masuk dalam peringkat 10 besar' },
]

const TIER_STYLES = {
  bronze:  'from-orange-400 via-orange-500 to-orange-600 border-orange-300/50 text-orange-950 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] ring-orange-200/50',
  silver:  'from-slate-200 via-slate-300 to-slate-400 border-white/60 text-slate-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9)] ring-slate-200/50',
  gold:    'from-amber-200 via-yellow-400 to-amber-500 border-yellow-200/60 text-amber-950 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] ring-amber-300/50',
  diamond: 'from-cyan-300 via-blue-400 to-fuchsia-400 border-cyan-200/60 text-indigo-950 shadow-[inset_0_2px_5px_rgba(255,255,255,0.9)] ring-cyan-300/50',
}

const TIER_HOVER_GLOW = {
  bronze:  'hover:shadow-[0_0_15px_rgba(249,115,22,0.5)]',
  silver:  'hover:shadow-[0_0_15px_rgba(148,163,184,0.5)]',
  gold:    'hover:shadow-[0_0_20px_rgba(250,204,21,0.6)]',
  diamond: 'hover:shadow-[0_0_25px_rgba(34,211,238,0.7)]',
}

export function BadgeGrid({ earned, equippedId, className, compact = false }: BadgeGridProps) {
  const earnedIds = new Set(earned.map((b) => b.id))

  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
        className
      )}
    >
      {ALL_BADGES.map((badge) => {
        const isEarned = earnedIds.has(badge.id)
        const isEquipped = badge.id === equippedId
        const tier = badge.tier || 'bronze'
        
        const style = isEarned 
          ? `bg-gradient-to-br border-2 ring-4 ring-offset-2 ${TIER_STYLES[tier]} ${TIER_HOVER_GLOW[tier]}`
          : 'bg-slate-100 border-2 border-slate-200 shadow-inner opacity-50 grayscale'

        return (
          <div
            key={badge.id}
            title={isEarned ? `${badge.display_name}: ${badge.description}` : 'Belum diraih'}
            className={cn(
              'group relative flex flex-col items-center gap-2 transition-all duration-300',
              isEarned ? 'cursor-pointer hover:scale-110 hover:-translate-y-1 hover:z-10' : 'cursor-default'
            )}
          >
            {/* Equipped indicator */}
            {isEquipped && (
              <div className="absolute -top-1.5 -right-1.5 z-20 flex h-6 w-6 animate-bounce items-center justify-center rounded-full bg-indigo-600 shadow-lg ring-2 ring-white">
                <span className="text-[10px] text-white">⭐</span>
              </div>
            )}

            {/* Aura effect for equipped badge */}
            {isEquipped && (
              <div className="absolute inset-0 z-0 animate-pulse rounded-full bg-indigo-400/30 blur-xl scale-150" />
            )}

            {/* Badge container shape */}
            <div className={cn(
              'relative z-10 flex items-center justify-center rounded-full transition-all duration-300',
              compact ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-16 w-16 sm:h-20 sm:w-20',
              style
            )}>
              <span className={cn(
                'flex items-center justify-center leading-none drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6',
                compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'
              )}>
                {badge.icon.startsWith('http') || badge.icon.startsWith('data:image') ? (
                  <img src={badge.icon} alt={badge.display_name} className="w-full h-full object-contain drop-shadow-sm" />
                ) : (
                  badge.icon
                )}
              </span>
            </div>

            {!compact && (
              <div className="flex flex-col items-center mt-1 w-full px-1">
                <span className={cn(
                  "text-center text-[10px] sm:text-xs font-bold leading-tight w-full truncate",
                  isEarned ? "text-slate-700 group-hover:text-indigo-600" : "text-slate-400"
                )}>
                  {badge.display_name}
                </span>
                {isEarned && (
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {tier}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
