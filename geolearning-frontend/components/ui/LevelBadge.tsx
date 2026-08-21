import { cn } from '@/lib/utils/cn'
import { calculateLevel } from '@/lib/utils/level'

interface LevelBadgeProps {
  xp?: number
  level?: number
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function LevelBadge({ xp, level: levelProp, size = 'sm', className }: LevelBadgeProps) {
  const level = levelProp ?? (xp !== undefined ? calculateLevel(xp) : 0)

  const colorClass =
    level >= 50
      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
      : level >= 20
      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
      : level >= 10
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      : level >= 5
      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      : 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-800'

  const sizeClass = {
    xs: 'px-1 py-[1px] text-[8px]',
    sm: 'px-1.5 py-[1px] text-[9px]',
    md: 'px-2 py-[2px] text-[10px]',
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold',
        colorClass,
        sizeClass,
        className
      )}
    >
      Lv.&nbsp;{level}
    </span>
  )
}
