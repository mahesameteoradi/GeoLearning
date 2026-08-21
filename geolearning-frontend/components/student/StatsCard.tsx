import { cn } from '@/lib/utils/cn'

interface StatsCardProps {
  label: string
  value: string | number
  icon: string
  subtitle?: string
  variant?: 'default' | 'xp' | 'streak' | 'quiz'
  className?: string
}

const variantStyles = {
  default: 'border-slate-200 bg-slate-50',
  xp:      'border-amber-200  bg-amber-50',
  streak:  'border-orange-200 bg-orange-50',
  quiz:    'border-blue-200   bg-blue-50',
}

const iconBg = {
  default: 'bg-slate-50',
  xp:      'bg-amber-50',
  streak:  'bg-orange-50',
  quiz:    'bg-blue-50',
}

const valueColor = {
  default: 'text-slate-800',
  xp:      'text-amber-600',
  streak:  'text-orange-600',
  quiz:    'text-blue-600',
}

export function StatsCard({
  label,
  value,
  icon,
  subtitle,
  variant = 'default',
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        // No transform on hover — border/bg change is much cheaper
        'rounded-2xl border p-5 transition-colors duration-150 hover:border-opacity-50',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className={cn('mt-1.5 text-2xl font-bold tabular-nums', valueColor[variant])}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl text-lg',
            iconBg[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
