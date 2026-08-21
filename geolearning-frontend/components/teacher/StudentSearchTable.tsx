'use client'

import { useState, useMemo } from 'react'
import { Search, Flame, ChevronDown, ChevronUp, X, BookOpen, Shield, Medal } from 'lucide-react'
import { calculateLevel, xpForLevel, getLevelMeaning } from '@/lib/utils/level'
import { cn } from '@/lib/utils/cn'
import { ALL_BADGES, BadgeIcon, BadgeShieldContainer } from '@/components/ui/BadgeGrid'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string
  nis_nip?: string | null
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  avatar_url: string | null
  enrolledClasses?: string[]
  badges?: { id: string, display_name: string, icon: string }[]
}

interface StudentSearchTableProps {
  students: Student[]
}

type SortKey = 'name' | 'xp' | 'level' | 'streak'

export function StudentSearchTable({ students }: StudentSearchTableProps) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('xp')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const sorted = useMemo(() => {
    let data = [...students]
    if (query.trim()) {
      const q = query.toLowerCase()
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.enrolledClasses ?? []).some((c) => c.toLowerCase().includes(q))
      )
    }
    data.sort((a, b) => {
      let va: number | string = 0
      let vb: number | string = 0
      if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'xp') { va = a.xp; vb = b.xp }
      else if (sortKey === 'level') { va = a.level; vb = b.level }
      else if (sortKey === 'streak') { va = a.current_streak; vb = b.current_streak }
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return data
  }, [students, query, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(key === 'name') }
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
    ) : null

  const levelColors = (lvl: number) =>
    lvl >= 20 ? 'bg-violet-50 text-blue-700'
    : lvl >= 10 ? 'bg-cyan-50 text-cyan-600'
    : lvl >= 5 ? 'bg-emerald-50 text-emerald-600'
    : 'bg-slate-50 text-slate-500'

  const hasClassData = students.some((s) => (s.enrolledClasses?.length ?? 0) > 0)

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Table area */}
      <div className={cn('flex-1 min-w-0 transition-all', selectedStudent ? 'xl:max-w-[calc(100%-300px)]' : '')}>
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, email, atau kelas…"
            className="w-full rounded-2xl border border-slate-200/80 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">#</th>
                  {[
                    { label: 'Siswa', key: 'name' as SortKey },
                    { label: 'Level', key: 'level' as SortKey },
                    { label: 'XP', key: 'xp' as SortKey },
                    { label: 'Streak', key: 'streak' as SortKey },
                  ].map(({ label, key }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="cursor-pointer select-none px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-indigo-600"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                  {/* Kelas column — only if data available */}
                  {hasClassData && (
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Kelas
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((s, idx) => {
                  const nextLevelXp = xpForLevel(calculateLevel(s.xp || 0) + 1)
                  const progress = Math.min(((s.xp || 0) / nextLevelXp) * 100, 100)
                  const isSelected = selectedStudent?.id === s.id
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudent(isSelected ? null : s)}
                      className={cn(
                        'group cursor-pointer transition-all duration-300 hover:shadow-sm',
                        isSelected
                          ? 'bg-indigo-50/80'
                          : 'hover:bg-indigo-50/60'
                      )}
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-600 transition-colors group-hover:text-indigo-600">
                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-xs font-bold text-slate-800 overflow-hidden relative">
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt={s.name} className="h-full w-full object-cover" />
                            ) : (
                              s.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 truncate max-w-[150px]">{s.name}</p>
                            <p className="text-[10px] text-slate-600 truncate max-w-[150px]">{s.nis_nip || s.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm', levelColors(calculateLevel(s.xp || 0)))}>
                          Lv. {calculateLevel(s.xp || 0)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-amber-600 font-semibold tabular-nums">
                            {s.xp.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Flame className={cn('h-3.5 w-3.5', s.current_streak > 0 ? 'text-orange-600' : 'text-slate-700')} />
                          <span className={cn('text-sm font-semibold', s.current_streak > 0 ? 'text-orange-600' : 'text-slate-600')}>
                            {s.current_streak}d
                          </span>
                        </div>
                      </td>
                      {hasClassData && (
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(s.enrolledClasses ?? []).length > 0 ? (
                              (s.enrolledClasses ?? []).map((cls) => (
                                <span key={cls} className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                  <BookOpen className="h-2.5 w-2.5" />
                                  {cls.length > 12 ? cls.slice(0, 12) + '…' : cls}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-700">—</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={hasClassData ? 6 : 5} className="py-10 text-center text-sm text-slate-600">
                      {query ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada siswa terdaftar'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Count */}
        <p className="mt-2 text-[11px] text-slate-600">
          Menampilkan {sorted.length} dari {students.length} siswa
        </p>
      </div>

      {/* Detail Drawer */}
      {selectedStudent && (
        <div className="w-full xl:w-72 flex-shrink-0 animate-slide-in">
          <div className="sticky top-0 rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Detail Siswa</p>
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Avatar + Name */}
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-xl font-extrabold text-slate-900 shadow-lg shadow-blue-600/20 overflow-hidden relative">
                {selectedStudent.avatar_url ? (
                  <img src={selectedStudent.avatar_url} alt={selectedStudent.name} className="h-full w-full object-cover" />
                ) : (
                  selectedStudent.name.charAt(0).toUpperCase()
                )}
              </div>
              <h3 className="font-bold text-slate-800">{selectedStudent.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{selectedStudent.nis_nip || selectedStudent.email}</p>
              
              {(() => {
                const dynamicLevel = calculateLevel(selectedStudent.xp || 0)
                const meaning = getLevelMeaning(dynamicLevel)
                return (
                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border ${meaning.color} bg-white px-2.5 py-1 shadow-sm`}>
                    <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{meaning.title}</span>
                  </div>
                )
              })()}

              <Link
                href={`/teacher/analytics/student/${selectedStudent.id}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 active:translate-y-0 active:shadow-sm"
              >
                Lihat Analisis Detail
              </Link>
            </div>

            {/* Enrolled Classes */}
            {(selectedStudent.enrolledClasses ?? []).length > 0 && (
              <div className="mb-4">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Kelas Saya</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedStudent.enrolledClasses ?? []).map((cls) => (
                    <span key={cls} className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                      <BookOpen className="h-2.5 w-2.5" />
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(selectedStudent.enrolledClasses ?? []).length === 0 && (
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-[11px] text-slate-600">Belum bergabung ke kelas manapun</p>
              </div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Level', value: `Lv. ${calculateLevel(selectedStudent.xp || 0)}`, color: 'text-blue-600' },
                { label: 'Total XP', value: selectedStudent.xp.toLocaleString(), color: 'text-amber-600' },
                { label: 'Streak', value: `${selectedStudent.current_streak} hari`, color: 'text-orange-600' },
                { label: 'Best Streak', value: `${selectedStudent.longest_streak} hari`, color: 'text-slate-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:border-blue-200">
                  <p className="text-[10px] text-slate-600">{label}</p>
                  <p className={`mt-0.5 text-sm font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* XP Progress Bar */}
            {(() => {
              const currentXp = selectedStudent.xp || 0
              const nextLevelXp = xpForLevel(calculateLevel(currentXp) + 1)
              const percent = Math.min((currentXp / nextLevelXp) * 100, 100)
              
              return (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Progres Level</span>
                    <span className="text-[11px] text-slate-500">{Math.round(percent)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-700">
                    <span>Lv. {calculateLevel(currentXp)}</span>
                    <span>{nextLevelXp.toLocaleString()} XP</span>
                  </div>
                </>
              )
            })()}

            {/* Badges */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Pencapaian Badges</p>
              {(selectedStudent.badges ?? []).length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {(selectedStudent.badges ?? []).map((badge) => {
                    const mappedBadge = ALL_BADGES.find(b => b.display_name === badge.display_name) || ALL_BADGES.find(b => b.id === badge.id)
                    const badgeId = mappedBadge?.id || 'first_quiz'
                    
                    return (
                      <div 
                        key={badge.id}
                        className="group flex flex-col items-center justify-center text-center"
                        title={badge.display_name}
                      >
                        <BadgeShieldContainer 
                          isEarned={true}
                          hoverGlow={true}
                          className="h-10 w-10 flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                        >
                          <BadgeIcon id={badgeId} />
                        </BadgeShieldContainer>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className="text-[11px] text-slate-600">Belum ada badge yang diraih</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
