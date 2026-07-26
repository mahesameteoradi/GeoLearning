import { cn } from '@/lib/utils/cn'
import { levelProgressPercent, xpForLevel, calculateLevel } from '@/lib/utils/level'

interface XpProgressBarProps {
  xp: number
  className?: string
  showLabel?: boolean
}

export function XpProgressBar({ xp, className, showLabel = true }: XpProgressBarProps) {
  const level = calculateLevel(xp)
  const percent = levelProgressPercent(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const xpInLevel = xp - currentLevelXp
  const xpNeeded = nextLevelXp - currentLevelXp

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-amber-600">Level {level}</span>
          <span className="text-slate-500">
            {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        </div>
      )}
      {/* Lightweight progress bar — no shimmer, no infinite animation */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-white/[0.08]">
        <div
          className="xp-bar-fill h-full rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
