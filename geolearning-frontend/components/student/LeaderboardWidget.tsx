import { cn } from '@/lib/utils/cn'
import { calculateLevel } from '@/lib/utils/level'
import { Trophy } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  name: string
  xp: number
  avatar_url?: string | null
  current_streak: number
}

interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  className?: string
}

const medalEmoji = ['🥇', '🥈', '🥉']

export function LeaderboardWidget({ entries, currentUserId, className }: LeaderboardWidgetProps) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Leaderboard</h3>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Top 5</span>
      </div>

      <div className="space-y-1.5">
        {entries.slice(0, 5).map((entry, index) => {
          const isCurrentUser = entry.id === currentUserId
          const level = calculateLevel(entry.xp)

          return (
            <div
              key={entry.id}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-md hover:bg-white cursor-pointer',
                // Top 3 get subtle colored borders
                index === 0 && 'border-amber-200 bg-amber-50',
                index === 1 && 'border-slate-200 bg-slate-50',
                index === 2 && 'border-orange-200 bg-orange-50',
                index >= 3 && 'border-slate-100 bg-transparent',
                // Current user highlight — solid border
                isCurrentUser && 'ring-1 ring-blue-500/50'
              )}
            >
              {/* Rank */}
              <span className="w-5 text-center text-sm leading-none">
                {index < 3 ? medalEmoji[index] : (
                  <span className="text-[11px] font-bold text-slate-500">{index + 1}</span>
                )}
              </span>

              {/* Avatar initial */}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-[11px] font-bold text-slate-800">
                {entry.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + level */}
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-xs font-semibold', isCurrentUser ? 'text-blue-700' : 'text-slate-800')}>
                  {entry.name}
                  {isCurrentUser && <span className="ml-1 text-[10px] text-slate-500 font-normal">(kamu)</span>}
                </p>
                <p className="text-[10px] text-slate-600">Lv. {level}</p>
              </div>

              {/* XP */}
              <span className="text-right text-[11px] font-bold tabular-nums text-amber-600">
                {entry.xp.toLocaleString()}
                <span className="ml-0.5 font-normal text-slate-600">xp</span>
              </span>
            </div>
          )
        })}

        {entries.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-600">Belum ada data</p>
        )}
      </div>
    </div>
  )
}
