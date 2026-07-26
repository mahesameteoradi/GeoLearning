import { Users, BookOpen, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ClassCardProps {
  id: string
  name: string
  description?: string | null
  joinCode: string
  studentCount: number
  moduleCount: number
  avgXp?: number
  className?: string
}

export function ClassCard({
  name,
  description,
  joinCode,
  studentCount,
  moduleCount,
  avgXp = 0,
  className,
}: ClassCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg hover:shadow-violet-900/20',
        className
      )}
    >
      {/* Decorative gradient corner */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-50 blur-2xl transition-all group-hover:bg-blue-100" />

      <div className="mb-3 flex items-start justify-between">
        <h3 className="line-clamp-1 text-base font-bold text-slate-900">{name}</h3>
        <code className="ml-2 flex-shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
          {joinCode}
        </code>
      </div>

      {description && (
        <p className="mb-4 line-clamp-2 text-xs text-slate-500">{description}</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-xl bg-slate-50 py-3">
          <Users className="mb-1 h-4 w-4 text-cyan-600" />
          <span className="text-base font-bold text-slate-800">{studentCount}</span>
          <span className="text-[10px] text-slate-500">Students</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-slate-50 py-3">
          <BookOpen className="mb-1 h-4 w-4 text-blue-600" />
          <span className="text-base font-bold text-slate-800">{moduleCount}</span>
          <span className="text-[10px] text-slate-500">Modules</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-slate-50 py-3">
          <TrendingUp className="mb-1 h-4 w-4 text-amber-600" />
          <span className="text-base font-bold text-slate-800">{avgXp.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">Avg XP</span>
        </div>
      </div>
    </div>
  )
}
