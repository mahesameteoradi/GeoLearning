'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, BarChart3, Users, Trophy, Clock, RefreshCw, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizMeta {
  id: string
  title: string
  question_count: number
  xp_reward: number
}

interface AttemptRow {
  id: string
  user_id: string
  student_name: string
  score: number
  xp_earned: number
  started_at: string
  completed_at: string | null
  time_taken: number | null
}

interface QuizResultsModalProps {
  quiz: QuizMeta
  onClose: () => void
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
    score >= 70 ? 'bg-cyan-50 text-cyan-600 border-cyan-200' :
    score >= 55 ? 'bg-amber-50 text-amber-600 border-amber-200' :
    'bg-red-50 text-red-600 border-red-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums ${color}`}>
      {score.toFixed(0)}%
    </span>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

import { useConfirm } from '@/components/ui/ConfirmProvider'

export function QuizResultsModal({ quiz, onClose }: QuizResultsModalProps) {
  const supabase = createClient()
  const { confirm } = useConfirm()
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const loadAttempts = useCallback(async () => {
    const { data } = await supabase
      .from('quiz_attempts')
      .select(`
        id, user_id, score, xp_earned, started_at, completed_at,
        user:users!quiz_attempts_user_id_fkey(name)
      `)
      .eq('quiz_id', quiz.id)
      .order('score', { ascending: true })

    const mapped: AttemptRow[] = (data ?? []).map(a => {
      const user = Array.isArray(a.user) ? a.user[0] : a.user as { name: string } | null
      const timeTaken = a.started_at && a.completed_at
        ? Math.round((new Date(a.completed_at).getTime() - new Date(a.started_at).getTime()) / 1000)
        : null
      return {
        id: a.id,
        user_id: a.user_id,
        student_name: user?.name ?? 'Siswa',
        score: a.score ?? 0,
        xp_earned: a.xp_earned ?? 0,
        started_at: a.started_at,
        completed_at: a.completed_at,
        time_taken: timeTaken,
      }
    })
    setAttempts(mapped)
    setLoading(false)
    setLastRefreshed(new Date())
  }, [quiz.id, supabase])

  const handleResetAttempt = async (attemptId: string, studentName: string) => {
    const isConfirmed = await confirm({
      title: 'Reset Kuis',
      message: `Hapus nilai dan reset kuis untuk ${studentName}? Siswa dapat mengerjakan ulang kuis ini.`,
      confirmText: 'Ya, Reset',
      variant: 'danger'
    })
    
    if (!isConfirmed) return
    
    try {
      const res = await fetch('/api/quizzes/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId })
      })
      
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mereset kuis')
      }
      
      import('react-hot-toast').then((m) => m.default.success(`Kuis ${studentName} berhasil direset`))
      loadAttempts()
    } catch (err: any) {
      import('react-hot-toast').then((m) => m.default.error(err.message || 'Gagal mereset kuis'))
    }
  }

  useEffect(() => {
    loadAttempts()

    // Real-time subscription
    const channel = supabase
      .channel(`quiz-results-${quiz.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quiz_attempts',
        filter: `quiz_id=eq.${quiz.id}`,
      }, () => { loadAttempts() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadAttempts, quiz.id, supabase])

  const completed = attempts.filter(a => a.completed_at)
  
  // Calculate best scores per user for accurate stats
  const bestScores = new Map<string, number>()
  completed.forEach(a => {
    const currentBest = bestScores.get(a.user_id) || -1
    if (a.score > currentBest) bestScores.set(a.user_id, a.score)
  })
  
  const uniqueStudentsCount = bestScores.size
  const bestScoresList = Array.from(bestScores.values())
  
  const avgScore = uniqueStudentsCount > 0
    ? bestScoresList.reduce((s, score) => s + score, 0) / uniqueStudentsCount
    : 0
  const highest = uniqueStudentsCount > 0 ? Math.max(...bestScoresList) : 0
  const lowest = uniqueStudentsCount > 0 ? Math.min(...bestScoresList) : 0

  function formatTime(secs: number) {
    if (secs < 60) return `${secs}d`
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}d`
  }

  function exportCSV() {
    const rows = [
      ['Nama', 'Skor (%)', 'XP', 'Waktu (detik)', 'Selesai'],
      ...completed.map(a => [
        a.student_name,
        a.score.toFixed(1),
        a.xp_earned.toString(),
        a.time_taken?.toString() ?? '-',
        a.completed_at ? new Date(a.completed_at).toLocaleString('id-ID') : '-',
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hasil-kuis-${quiz.title.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">📊 Hasil Kuis</h2>
            <p className="text-xs text-slate-500 truncate max-w-xs">{quiz.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAttempts}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
            {completed.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Real-time indicator */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-600">
              Live • terakhir diperbarui {formatDistanceToNow(lastRefreshed, { addSuffix: true, locale: idLocale })}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Siswa', value: uniqueStudentsCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
              { label: 'Rata-rata', value: `${avgScore.toFixed(0)}%`, icon: BarChart3, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
              { label: 'Tertinggi', value: `${highest.toFixed(0)}%`, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              { label: 'Terendah', value: uniqueStudentsCount > 0 ? `${lowest.toFixed(0)}%` : '-', icon: BarChart3, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`rounded-xl border ${border} ${bg} p-3`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
                </div>
                <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Score distribution bar */}
          {completed.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Distribusi Nilai</p>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                {[
                  { range: [85, 100], color: 'bg-emerald-500' },
                  { range: [70, 84], color: 'bg-cyan-500' },
                  { range: [55, 69], color: 'bg-amber-500' },
                  { range: [0, 54], color: 'bg-red-500' },
                ].map(({ range, color }) => {
                  const count = bestScoresList.filter(score => score >= range[0] && score <= range[1]).length
                  const pct = uniqueStudentsCount > 0 ? (count / uniqueStudentsCount) * 100 : 0
                  return pct > 0 ? <div key={color} className={`${color} transition-all`} style={{ width: `${pct}%` }} /> : null
                })}
              </div>
              <div className="mt-1.5 flex gap-4 text-[10px] text-slate-600">
                {[
                  { label: '≥85 Sangat Baik', color: 'bg-emerald-500' },
                  { label: '70–84 Baik', color: 'bg-cyan-500' },
                  { label: '55–69 Cukup', color: 'bg-amber-500' },
                  { label: '<55 Kurang', color: 'bg-red-500' },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="py-8 text-center text-slate-600 text-sm">Memuat data…</div>
          ) : attempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-slate-700" />
              <p className="text-sm text-slate-600">Belum ada siswa yang mengerjakan kuis ini.</p>
              {!quiz.question_count && (
                <p className="mt-1 text-xs text-slate-700">Pastikan kuis sudah dipublikasikan.</p>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Daftar Pengerjaan ({attempts.length})
              </p>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Siswa</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Nilai</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">XP</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Waktu</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Selesai</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {attempts.map((a, i) => (
                      <tr key={a.id} className={cn('transition-colors hover:bg-slate-50', i === 0 && a.completed_at && 'bg-violet-50')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-[10px] font-bold text-slate-800">
                              {a.student_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-800">{a.student_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.completed_at ? <ScoreBadge score={a.score} /> : <span className="text-xs text-slate-600">Sedang…</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-amber-600">
                          {a.completed_at ? `+${a.xp_earned}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                          {a.time_taken ? formatTime(a.time_taken) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-600">
                          {a.completed_at
                            ? formatDistanceToNow(new Date(a.completed_at), { addSuffix: true, locale: idLocale })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleResetAttempt(a.id, a.student_name)}
                            title="Reset kuis siswa ini"
                            className="inline-flex items-center justify-center rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
