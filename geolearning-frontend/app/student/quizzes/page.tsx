'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList, Clock, Star, ChevronRight, CheckCircle,
  Lock, Loader2, BookOpen, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizCard {
  id: string
  title: string
  class_name: string
  question_count: number
  time_limit: number | null
  xp_reward: number
  created_at: string
  attempt: {
    score: number
    xp_earned: number
    completed_at: string | null
  } | null
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ''}`} />
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}d`
  return `${Math.floor(seconds / 60)} menit`
}

// ─── Quiz Card Component ──────────────────────────────────────────────────────

function QuizItem({ quiz }: { quiz: QuizCard }) {
  const done = !!quiz.attempt?.completed_at
  const score = quiz.attempt?.score ?? 0
  const isNew = !done && (Date.now() - new Date(quiz.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000

  const scoreColor =
    score >= 85 ? 'text-emerald-600' :
    score >= 70 ? 'text-cyan-600' :
    score >= 55 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className={cn(
      'group relative rounded-2xl border bg-white p-5 transition-all',
      done
        ? 'border-emerald-200 hover:border-emerald-200'
        : 'border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-violet-900/10'
    )}>
      {/* Badge */}
      <div className="mb-3 flex items-center gap-2">
        {isNew && (
          <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-slate-800 uppercase tracking-widest animate-pulse">
            NEW
          </span>
        )}
        {done && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            <CheckCircle className="h-3 w-3" />
            Selesai
          </span>
        )}
        <span className="text-[10px] text-slate-600 truncate flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {quiz.class_name}
        </span>
      </div>

      <h3 className="mb-3 text-sm font-bold text-slate-900 line-clamp-2">{quiz.title}</h3>

      {/* Info pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
          <ClipboardList className="h-3 w-3" />
          {quiz.question_count} soal
        </span>
        {quiz.time_limit && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            {formatTime(quiz.time_limit)}
          </span>
        )}
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
          <Zap className="h-3 w-3" />
          +{quiz.xp_reward} XP
        </span>
      </div>

      {/* Score or CTA */}
      <div className="flex items-center justify-between">
        {done ? (
          <div>
            <p className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
              {score.toFixed(0)}%
            </p>
            <p className="text-[10px] text-slate-600">
              {quiz.attempt?.completed_at
                ? formatDistanceToNow(new Date(quiz.attempt.completed_at), { addSuffix: true, locale: idLocale })
                : ''}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600">Belum dikerjakan</p>
        )}

        <Link
          href={`/student/quizzes/${quiz.id}`}
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
            done
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
          )}
        >
          {done ? 'Lihat Detail' : 'Mulai Kuis'}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentQuizzesPage() {
  const supabase = createClient()
  const [quizzes, setQuizzes] = useState<QuizCard[]>([])
  const [loading, setLoading] = useState(true)

  const loadQuizzes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get classes this student is enrolled in
    const { data: enrollments } = await supabase
      .from('class_students')
      .select('class_id, class:classes(id, name)')
      .eq('student_id', user.id)

    const classIds = (enrollments ?? []).map(e => e.class_id)
    const classMap: Record<string, string> = {}
    for (const e of enrollments ?? []) {
      const cls = Array.isArray(e.class) ? e.class[0] : e.class as { id: string; name: string } | null
      if (cls) classMap[cls.id] = cls.name
    }

    if (classIds.length === 0) {
      setQuizzes([])
      setLoading(false)
      return
    }

    // Get published quizzes for those classes
    const { data: rawQuizzes } = await supabase
      .from('quizzes')
      .select(`
        id, title, class_id, time_limit, xp_reward, created_at,
        questions(id)
      `)
      .in('class_id', classIds)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    // Get this student's attempts
    const quizIds = (rawQuizzes ?? []).map(q => q.id)
    const { data: attempts } = quizIds.length > 0
      ? await supabase
          .from('quiz_attempts')
          .select('quiz_id, score, xp_earned, completed_at')
          .eq('user_id', user.id)
          .in('quiz_id', quizIds)
      : { data: [] }

    const attemptMap: Record<string, { score: number; xp_earned: number; completed_at: string | null }> = {}
    for (const a of attempts ?? []) {
      attemptMap[a.quiz_id] = { score: a.score ?? 0, xp_earned: a.xp_earned ?? 0, completed_at: a.completed_at }
    }

    const mapped: QuizCard[] = (rawQuizzes ?? []).map(q => ({
      id: q.id,
      title: q.title,
      class_name: q.class_id ? (classMap[q.class_id] ?? 'Kelas') : 'Kelas',
      question_count: (q.questions as { id: string }[]).length,
      time_limit: q.time_limit,
      xp_reward: q.xp_reward,
      created_at: q.created_at,
      attempt: attemptMap[q.id] ?? null,
    }))

    setQuizzes(mapped)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadQuizzes() }, [loadQuizzes])

  const pending = quizzes.filter(q => !q.attempt?.completed_at)
  const done = quizzes.filter(q => !!q.attempt?.completed_at)

  return (
    <div className="min-h-full p-5 lg:p-7">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          Kuis
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Kerjakan kuis dari gurumu dan kumpulkan XP!
        </p>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      )}

      {!loading && quizzes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm font-semibold text-slate-500">Belum ada kuis tersedia</p>
          <p className="mt-1 text-xs text-slate-600">
            Kuis akan muncul di sini setelah gurumu mempublikasikannya.
          </p>
        </div>
      )}

      {!loading && pending.length > 0 && (
        <section className="mb-7">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            ⏳ Belum Dikerjakan ({pending.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pending.map(q => <QuizItem key={q.id} quiz={q} />)}
          </div>
        </section>
      )}

      {!loading && done.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            ✅ Sudah Selesai ({done.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {done.map(q => <QuizItem key={q.id} quiz={q} />)}
          </div>
        </section>
      )}
    </div>
  )
}
