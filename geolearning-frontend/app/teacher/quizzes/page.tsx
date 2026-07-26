'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList, Plus, Trash2, Eye, EyeOff, Users,
  BookOpen, Clock, Star, ChevronRight, Loader2,
  FileText, Award, BarChart3, X, Edit3,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { QuizEditorModal } from '@/components/teacher/QuizEditorModal'
import { QuizResultsModal } from '@/components/teacher/QuizResultsModal'
import type { Metadata } from 'next'

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
}: {
  quiz: QuizItem
  onEdit: (quiz: QuizItem) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string, current: boolean) => void
  onViewResults: (quiz: QuizItem) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleDelete() {
    if (!confirm(`Hapus kuis "${quiz.title}"? Semua data attempt akan ikut terhapus.`)) return
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
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-violet-900/10">
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
            disabled={toggling}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
            title={quiz.is_published ? 'Sembunyikan' : 'Publikasikan'}
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
        <button
          onClick={() => onViewResults(quiz)}
          className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          Hasil <ChevronRight className="h-3 w-3" />
        </button>
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
  const [userId, setUserId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClassId, setFilterClassId] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Manajemen Kuis
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Buat, kelola, dan pantau kuis gamifikasi untuk siswa
          </p>
        </div>
        <button
          onClick={() => { setEditingQuiz(null); setShowEditor(true) }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Buat Kuis
        </button>
      </div>

      {/* Stats */}
      {!loading && quizzes.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Kuis (Tersaring)', value: filteredQuizzes.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
            { label: 'Published', value: published.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: 'Draft', value: drafts.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
            { label: 'Total Attempt', value: filteredQuizzes.reduce((s, q) => s + q.attempt_count, 0), color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
              <p className={`mt-1.5 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
            <ClipboardList className="h-7 w-7 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada kuis</p>
          <p className="mt-1 text-xs text-slate-600">
            {classes.length === 0 ? 'Buat kelas terlebih dahulu, lalu buat kuis.' : 'Klik "Buat Kuis" untuk mulai.'}
          </p>
          {classes.length > 0 && (
            <button
              onClick={() => { setEditingQuiz(null); setShowEditor(true) }}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Buat Kuis Pertama
            </button>
          )}
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
    </div>
  )
}
