import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, Bell, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'quiz' | 'notification' | 'badge' | 'material' | 'project'
  title: string
  subtitle?: string
  timestamp: string
  xp?: number
  quizId?: string
  projectId?: string
  materialId?: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
  className?: string
}

const typeConfig = {
  quiz: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
  },
  notification: {
    icon: Bell,
    bg: 'bg-amber-50',
    border: 'border-blue-300',
    iconColor: 'text-blue-600',
  },
  badge: {
    icon: BookOpen,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  material: {
    icon: BookOpen,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
  project: {
    icon: CheckCircle,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-50 py-10 text-center', className)}>
        <span className="text-3xl">📭</span>
        <p className="mt-2 text-sm text-slate-500">No activity yet — complete a quiz to get started!</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const cfg = typeConfig[item.type]
        const Icon = cfg.icon
        
        const content = (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-300',
              item.quizId ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md hover:bg-white' : 'cursor-default hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-sm hover:bg-white',
              cfg.bg,
              cfg.border
            )}
          >
            <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
              <Icon className={cn('h-4 w-4', cfg.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
              {item.subtitle && (
                <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {item.xp !== undefined && item.xp > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                  +{item.xp} XP
                </span>
              )}
              <span className="text-[10px] text-slate-600">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </span>
            </div>
          </div>
        )

        if (item.quizId) {
          return (
            <Link href={`/student/quizzes/${item.quizId}`} key={item.id} className="block group">
              {content}
            </Link>
          )
        }
        if (item.projectId) {
          return (
            <Link href={`/student/projects/${item.projectId}`} key={item.id} className="block group">
              {content}
            </Link>
          )
        }

        return <div key={item.id} className="group">{content}</div>
      })}
    </div>
  )
}
