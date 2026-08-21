
import { cn } from '@/lib/utils/cn'
import { calculateLevel } from '@/lib/utils/level'

interface Badge {
  id: string
  icon: string
  display_name: string
}

interface AvatarDisplayProps {
  avatarUrl?: string | null
  name: string
  xp: number
  equippedBadge?: Badge | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'h-10 w-10', badge: 'h-5 w-5 text-xs', text: 'text-lg' },
  md: { container: 'h-16 w-16', badge: 'h-6 w-6 text-sm', text: 'text-2xl' },
  lg: { container: 'h-24 w-24', badge: 'h-9 w-9 text-xl', text: 'text-4xl' },
}

export function AvatarDisplay({
  avatarUrl,
  name,
  xp,
  equippedBadge,
  size = 'md',
  className,
}: AvatarDisplayProps) {
  const level = calculateLevel(xp)
  const sz = sizeMap[size]
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      {/* Avatar ring — color based on level tier */}
      <div
        className={cn(
          'relative rounded-full p-[3px]',
          level >= 50
            ? 'bg-gradient-to-br from-amber-400 to-orange-600'
            : level >= 20
            ? 'bg-gradient-to-br from-amber-500 to-blue-500'
            : level >= 10
            ? 'bg-gradient-to-br from-blue-400 to-blue-600'
            : 'bg-gradient-to-br from-slate-500 to-slate-700'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden rounded-full bg-white',
            sz.container
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={cn('font-bold text-slate-800', sz.text)}>
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Equipped badge overlay */}
      {equippedBadge && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-[#0F0F1A] bg-white overflow-hidden',
            sz.badge
          )}
          title={equippedBadge.display_name}
        >
          <span className="flex items-center justify-center w-full h-full p-[1px]">
            {equippedBadge.icon.startsWith('http') || equippedBadge.icon.startsWith('data:image') ? (
              <img src={equippedBadge.icon} alt={equippedBadge.display_name} className="w-full h-full object-contain" />
            ) : (
              equippedBadge.icon
            )}
          </span>
        </div>
      )}
    </div>
  )
}
