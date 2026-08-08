import { cn } from '@/lib/utils/cn'
import { 
  Target, Star, Flame, Shield, Library, Zap, 
  Settings, Trophy, Rocket, Globe, Crown, 
  Leaf, Medal, Award
} from 'lucide-react'

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

export const BadgeIcon = ({ id, className }: { id: string, className?: string }) => {
  const baseClass = cn("w-full h-full drop-shadow-sm", className);
  
  switch(id) {
    case 'first_quiz': return <Target className={cn(baseClass, "text-rose-400")} />;
    case 'xp_100': return <Star className={cn(baseClass, "text-yellow-400 fill-yellow-400")} />;
    case 'level_5': return (
      <div className={cn("relative flex items-center justify-center w-full h-full", className)}>
        <Settings className="w-[90%] h-[90%] text-slate-300" />
        <Leaf className="absolute w-[45%] h-[45%] text-emerald-400 fill-emerald-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
    );
    case 'streak_3': return <Flame className={cn(baseClass, "text-orange-500 fill-orange-500")} />;
    case 'xp_500': return (
      <div className={cn("relative flex items-center justify-center w-full h-full", className)}>
        <Shield className="w-full h-full text-slate-200 fill-slate-200" />
        <Star className="absolute w-[45%] h-[45%] text-amber-500 fill-amber-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]" />
      </div>
    );
    case 'level_10': return <Library className={cn(baseClass, "text-amber-200")} />;
    case 'streak_7': return <Zap className={cn(baseClass, "text-yellow-400 fill-yellow-400")} />;
    case 'perfect_score': return (
      <div className={cn("flex flex-col items-center justify-center w-full h-full text-emerald-400", className)}>
        <span className="font-black italic text-[0.6em] leading-none -mb-[2px]">100</span>
        <div className="w-[60%] h-[3px] bg-emerald-400 rounded-full mt-[2px]" />
      </div>
    );
    case 'xp_1000': return <Settings className={cn(baseClass, "text-cyan-400")} />;
    case 'level_20': return <Trophy className={cn(baseClass, "text-yellow-400 fill-yellow-400")} />;
    case 'streak_30': return (
      <div className={cn("relative flex items-center justify-center w-full h-full", className)}>
        <Rocket className="w-[80%] h-[80%] text-rose-400 fill-rose-400 -rotate-45" />
      </div>
    );
    case 'xp_5000': return <Globe className={cn(baseClass, "text-blue-300")} />;
    case 'level_50': return <Crown className={cn(baseClass, "text-yellow-400 fill-yellow-400")} />;
    case 'top_10': return (
      <div className={cn("relative flex items-center justify-center w-full h-full", className)}>
        <Award className="w-[85%] h-[85%] text-fuchsia-400 fill-fuchsia-400" />
      </div>
    );
    default: return <Award className={cn(baseClass, "text-white")} />;
  }
}

export const BadgeShieldContainer = ({ children, className, isEarned = true, hoverGlow = false }: { children: React.ReactNode, className?: string, isEarned?: boolean, hoverGlow?: boolean }) => {
  return (
    <div className={cn("relative flex items-center justify-center transition-all duration-300 z-10", className, hoverGlow && "group-hover:drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]")}>
      <svg 
        className={cn("absolute inset-0 w-full h-full drop-shadow-sm transition-all duration-300", !isEarned && "opacity-50 grayscale")} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 115"
      >
        <defs>
          <path id="shield" d="M50 3 Q75 11 95 16 C95 61 75 96 50 112 C25 96 5 61 5 16 Q25 11 50 3 Z" />
          <clipPath id="leftHalf">
            <rect x="0" y="0" width="50" height="115" />
          </clipPath>
          <clipPath id="rightHalf">
            <rect x="50" y="0" width="50" height="115" />
          </clipPath>
          
          <linearGradient id="leftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="rightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>

        {/* Outer border (dark slate) */}
        <use href="#shield" fill="#1e293b" />
        
        {/* Inner white border */}
        <use href="#shield" fill="#ffffff" style={{ transformOrigin: '50px 57px', transform: 'scale(0.92)' }} />
        
        {/* Blue split background */}
        <g style={{ transformOrigin: '50px 57px', transform: 'scale(0.85)' }}>
          <use href="#shield" fill="url(#leftGrad)" clipPath="url(#leftHalf)" />
          <use href="#shield" fill="url(#rightGrad)" clipPath="url(#rightHalf)" />
        </g>
      </svg>
      <div className="relative z-10 w-[42%] h-[42%] mt-[-5%] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 text-white">
        {children}
      </div>
    </div>
  )
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
            <BadgeShieldContainer 
              isEarned={isEarned} 
              hoverGlow={isEarned}
              className={compact ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10 sm:h-12 sm:w-12'}
            >
              <BadgeIcon id={badge.id} />
            </BadgeShieldContainer>

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
