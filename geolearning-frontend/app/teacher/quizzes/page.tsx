'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList, Plus, Trash2, Eye, EyeOff, Users,
  BookOpen, Clock, Star, ChevronRight, Loader2,
  FileText, Award, BarChart3, X, Edit3, Activity,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { QuizEditorModal } from '@/components/teacher/QuizEditorModal'
import { QuizResultsModal } from '@/components/teacher/QuizResultsModal'
import { QuizLiveMonitorModal } from '@/components/teacher/QuizLiveMonitorModal'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import type { Metadata } from 'next'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { quizzesTeacherSteps } from '@/lib/utils/tourSteps'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizItem {
  id: string
  title: string
  class_id: string | null
  module_id: string | null
  time_limit: number | null
  xp_reward: number
  is_published: boolean
  created_at: string
  question_count: number
  attempt_count: number
  avg_score: number | null
  class_name?: string
}

interface ClassOption {
  id: string
  name: string
  gamification_mode: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ''}`} />
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)} mnt`
}

// ─── Quiz Card ────────────────────────────────────────────────────────────────

function QuizCard({
  quiz,
  onEdit,
  onDelete,
  onTogglePublish,
  onViewResults,
  onLiveMonitor,
  isVerified,
}: {
  quiz: QuizItem
  onEdit: (quiz: QuizItem) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string, current: boolean) => void
  onViewResults: (quiz: QuizItem) => void
  onLiveMonitor: (quiz: QuizItem) => void
  isVerified: boolean
}) {
  const { confirm } = useConfirm()
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleDelete() {
    const isConfirmed = await confirm({
      title: 'Hapus Kuis',
      message: `Hapus kuis "${quiz.title}"? Semua data attempt akan ikut terhapus.`,
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setDeleting(true)
    await onDelete(quiz.id)
    setDeleting(false)
  }

  async function handleToggle() {
    setToggling(true)
    await onTogglePublish(quiz.id, quiz.is_published)
    setToggling(false)
  }

  return (
    <div className="group relative rounded-3xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
              quiz.is_published
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            )}>
              {quiz.is_published ? '● Published' : '○ Draft'}
            </span>
            {quiz.class_name && (
              <span className="text-[10px] text-slate-600 truncate">{quiz.class_name}</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 truncate">{quiz.title}</h3>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(quiz)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Edit kuis"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling || !isVerified}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              !isVerified 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-600'
            }`}
            title={!isVerified ? 'Menunggu Verifikasi Admin' : (quiz.is_published ? 'Sembunyikan' : 'Publikasikan')}
          >
            {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : quiz.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Hapus kuis"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: FileText, label: 'Soal', value: quiz.question_count, color: 'text-blue-600' },
          { icon: Clock, label: 'Waktu', value: quiz.time_limit ? formatTime(quiz.time_limit) : '∞', color: 'text-cyan-600' },
          { icon: Star, label: 'XP', value: `+${quiz.xp_reward}`, color: 'text-amber-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl bg-slate-50 p-2.5 text-center">
            <Icon className={`mx-auto mb-1 h-3.5 w-3.5 ${color}`} />
            <p className="text-xs font-bold text-slate-800">{value}</p>
            <p className="text-[10px] text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Attempt stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {quiz.attempt_count} mengerjakan
          </span>
          {quiz.avg_score !== null && (
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Rata-rata {quiz.avg_score.toFixed(0)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {quiz.is_published && (
            <button
              onClick={() => onLiveMonitor(quiz)}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
            >
              <Activity className="h-3 w-3 animate-pulse" /> Live
            </button>
          )}
          <button
            onClick={() => onViewResults(quiz)}
            className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Hasil <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherQuizzesPage() {
  const supabase = createClient()
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null)
  const [viewingResults, setViewingResults] = useState<QuizItem | null>(null)
  const [liveMonitorQuiz, setLiveMonitorQuiz] = useState<QuizItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClassId, setFilterClassId] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [isVerified, setIsVerified] = useState(false)
  const [userId, setUserId] = useState('')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Check verification status
    const { data: profile } = await supabase.from('users').select('verification_status').eq('id', user.id).single()
    setIsVerified(profile?.verification_status === 'VERIFIED')

    // Load classes
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name, gamification_mode')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
    setClasses(cls ?? [])

    const classIds = (cls ?? []).map(c => c.id)

    if (classIds.length === 0) {
      setQuizzes([])
      setLoading(false)
      return
    }

    // Load quizzes for this teacher's classes
    const { data: rawQuizzes } = await supabase
      .from('quizzes')
      .select(`
        id, title, class_id, module_id, time_limit, xp_reward, is_published, created_at,
        questions(id),
        quiz_attempts(score, user_id)
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })

    const classMap = Object.fromEntries((cls ?? []).map(c => [c.id, c.name]))

    const mapped: QuizItem[] = (rawQuizzes ?? []).map((q) => {
      const attempts = (q.quiz_attempts as { score: number; user_id: string }[]) ?? []
      const completed = attempts.filter(a => a.score >= 0)
      const avgScore = completed.length > 0
        ? completed.reduce((s, a) => s + a.score, 0) / completed.length
        : null
      return {
        id: q.id,
        title: q.title,
        class_id: q.class_id,
        module_id: q.module_id,
        time_limit: q.time_limit,
        xp_reward: q.xp_reward,
        is_published: q.is_published,
        created_at: q.created_at,
        question_count: (q.questions as { id: string }[]).length,
        attempt_count: attempts.length,
        avg_score: avgScore,
        class_name: q.class_id ? classMap[q.class_id] : undefined,
      }
    })
    setQuizzes(mapped)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete(id: string) {
    const { error } = await supabase.from('quizzes').delete().eq('id', id)
    if (error) { toast.error('Gagal menghapus kuis'); return }
    toast.success('Kuis dihapus')
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  async function handleTogglePublish(id: string, current: boolean) {
    const { error } = await supabase.from('quizzes').update({ is_published: !current, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Gagal mengubah status'); return }
    toast.success(!current ? '✅ Kuis dipublikasikan!' : 'Kuis disimpan sebagai draft')
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, is_published: !current } : q))
  }

  const filteredQuizzes = quizzes.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchClass = filterClassId === 'ALL' || q.class_id === filterClassId
    const matchStatus = filterStatus === 'ALL' || (filterStatus === 'PUBLISHED' ? q.is_published : !q.is_published)
    return matchSearch && matchClass && matchStatus
  })

  const published = filteredQuizzes.filter(q => q.is_published)
  const drafts = filteredQuizzes.filter(q => !q.is_published)

  return (
    <div className="min-h-full p-5 lg:p-7">
      <OnboardingTour tourKey="quizzes_teacher" steps={quizzesTeacherSteps} />
      {!isVerified && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800">Menunggu Verifikasi Admin</h3>
              <p className="text-xs text-amber-700">Akun Anda belum diverifikasi. Anda dapat membuat kuis, tetapi belum bisa mempublikasikannya ke siswa.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <ClipboardList className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Manajemen Kuis
              </h1>
              <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">
                Buat, kelola, dan pantau kuis gamifikasi untuk mengevaluasi pemahaman siswa secara *real-time*.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && quizzes.length > 0 && (
        <div id="tour-teacher-quiz-list" className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Kuis (Tersaring)', value: filteredQuizzes.length, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', gradient: 'from-indigo-500/5 to-transparent' },
            { label: 'Published', value: published.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', gradient: 'from-emerald-500/5 to-transparent' },
            { label: 'Draft', value: drafts.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', gradient: 'from-amber-500/5 to-transparent' },
            { label: 'Total Attempt', value: filteredQuizzes.reduce((s, q) => s + q.attempt_count, 0), color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', gradient: 'from-cyan-500/5 to-transparent' },
          ].map(({ label, value, color, bg, border, gradient }) => (
            <div key={label} className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-black tabular-nums ${color} drop-shadow-sm`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {!loading && quizzes.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Cari nama kuis..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
          />
          <select
            value={filterClassId}
            onChange={e => setFilterClassId(e.target.value)}
            className="w-full sm:max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full sm:max-w-[150px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredQuizzes.length === 0 && (
        <div id="tour-teacher-quiz-list" className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
            <ClipboardList className="h-7 w-7 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada kuis</p>
          <p className="mt-1 text-xs text-slate-600">
            {classes.length === 0 ? 'Buat kelas terlebih dahulu.' : 'Anda dapat menambahkan Kuis melalui halaman Detail Kelas.'}
          </p>
        </div>
      )}

      {/* Published quizzes */}
      {!loading && published.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            ✅ Published ({published.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {published.map(q => (
              <QuizCard
                key={q.id}
                quiz={q}
                onEdit={(quiz) => { setEditingQuiz(quiz); setShowEditor(true) }}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
                onViewResults={setViewingResults}
                onLiveMonitor={setLiveMonitorQuiz}
                isVerified={isVerified}
              />
            ))}
          </div>
        </section>
      )}

      {/* Draft quizzes */}
      {!loading && drafts.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            📝 Draft ({drafts.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {drafts.map(q => (
              <QuizCard
                key={q.id}
                quiz={q}
                onEdit={(quiz) => { setEditingQuiz(quiz); setShowEditor(true) }}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
                onViewResults={setViewingResults}
                onLiveMonitor={setLiveMonitorQuiz}
                isVerified={isVerified}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {showEditor && (
        <QuizEditorModal
          classes={classes}
          quiz={editingQuiz}
          onClose={() => { setShowEditor(false); setEditingQuiz(null) }}
          onSaved={loadData}
        />
      )}

      {viewingResults && (
        <QuizResultsModal
          quiz={viewingResults}
          onClose={() => setViewingResults(null)}
        />
      )}

      {liveMonitorQuiz && (
        <QuizLiveMonitorModal
          quiz={liveMonitorQuiz}
          onClose={() => setLiveMonitorQuiz(null)}
        />
      )}
    </div>
  )
}
