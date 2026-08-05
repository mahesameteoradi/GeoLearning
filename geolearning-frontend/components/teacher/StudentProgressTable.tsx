import { calculateLevel, xpForLevel } from '@/lib/utils/level'
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
    <div className={cn('overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Rank
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Student
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Level
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 min-w-[160px]">
                XP Progress
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Streak
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total XP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Flame className="h-8 w-8 mb-3 opacity-20" />
                    <p className="text-sm font-semibold text-slate-500">Belum ada progres siswa</p>
                    <p className="text-xs mt-1">Undang siswa ke kelas Anda untuk melihat progres mereka di sini.</p>
                  </div>
                </td>
              </tr>
            ) : sorted.map((student, idx) => {
              const level = calculateLevel(student.xp)
              const nextLevelXp = xpForLevel(level + 1)
              const progress = Math.min((student.xp / nextLevelXp) * 100, 100)

              return (
                <tr
                  key={student.id}
                  className="group relative z-0 transition-all duration-300 hover:z-10 hover:scale-[1.01] hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-default"
                >
                  <td className="px-5 py-4 text-center text-sm font-bold text-slate-500 transition-colors group-hover:text-indigo-600">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-indigo-500/30 overflow-hidden relative">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt={student.name} className="h-full w-full object-cover" />
                        ) : (
                          student.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-32 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{Math.round(progress)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
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
                  <td className="px-5 py-4 text-sm font-bold text-amber-600">
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
