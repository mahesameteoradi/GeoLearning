'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Users, Activity, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface QuizMeta {
  id: string
  title: string
  question_count: number
  time_limit: number | null
}

interface AttemptLive {
  id: string
  user_id: string
  student_name: string
  answers_count: number
  is_completed: boolean
  score: number
  started_at: string
}

interface QuizLiveMonitorModalProps {
  quiz: QuizMeta
  onClose: () => void
}

export function QuizLiveMonitorModal({ quiz, onClose }: QuizLiveMonitorModalProps) {
  const supabase = createClient()
  const [attempts, setAttempts] = useState<AttemptLive[]>([])
  const [loading, setLoading] = useState(true)

  const loadAttempts = useCallback(async () => {
    const { data } = await supabase
      .from('quiz_attempts')
      .select(`
        id, user_id, score, answers, started_at, completed_at,
        user:users!quiz_attempts_user_id_fkey(name)
      `)
      .eq('quiz_id', quiz.id)
      .order('started_at', { ascending: false })

    const mapped: AttemptLive[] = (data ?? []).map(a => {
      const user = Array.isArray(a.user) ? a.user[0] : a.user as { name: string } | null
      const answersObj = a.answers as Record<string, any> | null
      const answersCount = answersObj ? Object.keys(answersObj).length : 0

      return {
        id: a.id,
        user_id: a.user_id,
        student_name: user?.name ?? 'Siswa',
        answers_count: answersCount,
        is_completed: !!a.completed_at,
        score: a.score ?? 0,
        started_at: a.started_at,
      }
    })
    setAttempts(mapped)
    setLoading(false)
  }, [quiz.id, supabase])

  useEffect(() => {
    loadAttempts()

    // Real-time subscription for live progress
    const channel = supabase
      .channel(`quiz-live-${quiz.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quiz_attempts',
        filter: `quiz_id=eq.${quiz.id}`,
      }, () => {
        // Reload data to get the latest progress
        loadAttempts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadAttempts, quiz.id, supabase])

  const totalQuestions = quiz.question_count || 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      style={{ backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)' }}
    >
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800/50 px-6 py-4 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Activity className="h-4 w-4 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white">Live Monitor</h2>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md">{quiz.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Stats Bar */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Peserta</p>
              <p className="text-2xl font-black text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                {attempts.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mengerjakan</p>
              <p className="text-2xl font-black text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                {attempts.filter(a => !a.is_completed).length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Selesai</p>
              <p className="text-2xl font-black text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                {attempts.filter(a => a.is_completed).length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Soal</p>
              <p className="text-2xl font-black text-white">
                {quiz.question_count}
              </p>
            </div>
          </div>

          {/* Live Leaderboard */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Progress Siswa</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Memuat live data...</div>
            ) : attempts.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400">Belum ada siswa yang memulai kuis ini.</p>
                <p className="text-xs text-slate-500 mt-1">Data akan otomatis muncul di sini ketika siswa mulai mengerjakan.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {attempts.map(a => {
                  const progressPct = a.is_completed ? 100 : Math.min(100, (a.answers_count / totalQuestions) * 100)
                  
                  return (
                    <div key={a.id} className="p-4 px-6 flex items-center gap-4 transition-colors hover:bg-slate-700/30">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/20">
                        {a.student_name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-white truncate pr-4">{a.student_name}</span>
                          {a.is_completed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                              <CheckCircle className="h-3 w-3" /> Selesai • {a.score.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-400 border border-blue-500/30 animate-pulse">
                              <Activity className="h-3 w-3" /> Mengerjakan ({a.answers_count}/{totalQuestions})
                            </span>
                          )}
                        </div>
                        
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 shadow-inner">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-out",
                              a.is_completed ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-cyan-400"
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
