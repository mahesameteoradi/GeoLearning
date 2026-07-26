import { cn } from '@/lib/utils/cn'
import { calculateLevel } from '@/lib/utils/level'

interface LevelBadgeProps {
  xp?: number
  level?: number
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function LevelBadge({ xp, level: levelProp, size = 'sm', className }: LevelBadgeProps) {
  const level = levelProp ?? (xp !== undefined ? calculateLevel(xp) : 1)

  const colorClass =
    level >= 50
      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
      : level >= 20
      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white'
      : level >= 10
      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
      : level >= 5
      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
      : 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-800'

  const sizeClass = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold tracking-wide',
        colorClass,
        sizeClass,
        className
      )}
    >
      Lv.&nbsp;{level}
    </span>
  )
}
