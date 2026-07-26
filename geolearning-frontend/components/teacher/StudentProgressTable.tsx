import { calculateLevel, levelProgressPercent } from '@/lib/utils/level'
import { cn } from '@/lib/utils/cn'
import { Flame } from 'lucide-react'

interface StudentRow {
  id: string
  name: string
  email: string
  xp: number
  current_streak: number
  avatar_url?: string | null
}

interface StudentProgressTableProps {
  students: StudentRow[]
  className?: string
}

export function StudentProgressTable({ students, className }: StudentProgressTableProps) {
  const sorted = [...students].sort((a, b) => b.xp - a.xp)

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Student
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Level
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 min-w-[160px]">
                XP Progress
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Streak
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Total XP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sorted.map((student, idx) => {
              const level = calculateLevel(student.xp)
              const progress = levelProgressPercent(student.xp)

              return (
                <tr
                  key={student.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-center text-sm font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-xs font-bold text-slate-800">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                        level >= 20
                          ? 'bg-violet-50 text-blue-700'
                          : level >= 10
                          ? 'bg-cyan-50 text-cyan-600'
                          : level >= 5
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-50 text-slate-500'
                      )}
                    >
                      Lv. {level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Flame
                        className={cn(
                          'h-3.5 w-3.5',
                          student.current_streak > 0 ? 'text-orange-600' : 'text-slate-600'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          student.current_streak > 0 ? 'text-orange-600' : 'text-slate-600'
                        )}
                      >
                        {student.current_streak}d
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-amber-600">
                    {student.xp.toLocaleString()}
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-600">
                  No students enrolled yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
