'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, FileText, Video, Presentation, LinkIcon,
  FileImage, Download, ExternalLink, BookOpen, GraduationCap,
  Hash, Loader2, Users, MessageSquare, Trophy, CheckCircle
} from 'lucide-react'
import { ClassLeaderboard } from '@/components/classes/ClassLeaderboard'
import { InteractiveMapViewer } from '@/components/ui/InteractiveMapViewer'
import { ExpeditionMap } from '@/components/student/ExpeditionMap'
import { cn } from '@/lib/utils/cn'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { classDetailStudentSteps } from '@/lib/utils/tourSteps'

// ─── Types ───────────────────────────────────────────────────────────────────

type FileCategory = 'pdf' | 'video' | 'ppt' | 'doc' | 'link' | 'image'

interface MaterialItem {
  id: string
  title: string
  type: string
  content_url: string | null
  content_text: string | null
  order: number
  created_at: string
}

interface QuizItem {
  id: string
  title: string
  xp_reward: number
  passing_score: number | null
  order: number
  created_at: string
  quiz_type?: 'FORMATIF' | 'SUMATIF'
  max_attempts?: number | null
}

interface ClassInfo {
  id: string
  name: string
  description: string | null
  join_code: string
  teacher: { name: string } | null
  modules: {
    id: string
    title: string
    order: number
    materials: MaterialItem[]
    quizzes: QuizItem[]
  }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryFromUrl(url: string | null, type: string): FileCategoryExpanded {
  if (type === 'VIDEO') return 'video'
  if (type === 'INTERACTIVE_MAP') return 'interactive_map'
  if (!url) return 'link'
  const ext = url.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
  if (['ppt', 'pptx'].includes(ext)) return 'ppt'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image'
  if (url.startsWith('http') && !url.match(/\.(pdf|mp4|ppt|doc)$/i)) return 'link'
  return 'pdf'
}

type FileCategoryExpanded = FileCategory | 'interactive_map'
import { Map as MapIcon, Eye } from 'lucide-react'

const CATEGORY_META: Record<FileCategoryExpanded, {
  icon: React.ElementType; color: string; bg: string; border: string; label: string; actionLabel: string
}> = {
  pdf:   { icon: FileText,     color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'PDF',        actionLabel: 'Lihat PDF' },
  video: { icon: Video,        color: 'text-blue-400',   bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'Video',      actionLabel: 'Tonton' },
  ppt:   { icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Presentasi', actionLabel: 'Unduh' },
  doc:   { icon: FileText,     color: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-200',    label: 'Dokumen',    actionLabel: 'Unduh' },
  link:  { icon: LinkIcon,     color: 'text-blue-600', bg: 'bg-violet-50', border: 'border-violet-200', label: 'Link',       actionLabel: 'Buka' },
  image: { icon: FileImage,    color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',label: 'Gambar',     actionLabel: 'Lihat' },
  interactive_map: { icon: MapIcon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Peta Pembelajaran', actionLabel: 'Buka Peta' },
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className ?? ''}`} />
}

// ─── Material Card ────────────────────────────────────────────────────────────

function MaterialCard({ mat, index, onViewMap }: { mat: MaterialItem; index: number; onViewMap: (mat: MaterialItem) => void }) {
  const cat = getCategoryFromUrl(mat.content_url, mat.type)
  const meta = CATEGORY_META[cat]
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'group flex items-start gap-4 rounded-2xl border p-4 transition-all hover:shadow-md bg-white',
        meta.border,
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Type icon */}
      <div className={cn(
        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border',
        meta.bg, meta.border
      )}>
        <Icon className={cn('h-5 w-5', meta.color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-white/90 transition-colors truncate">
            {mat.title}
          </h3>
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            meta.bg, meta.color
          )}>
            {meta.label}
          </span>
        </div>
        {mat.content_text && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{mat.content_text}</p>
        )}
      </div>

      {/* Action */}
      {mat.type === 'INTERACTIVE_MAP' ? (
        <button
          onClick={() => onViewMap(mat)}
          className={cn(
            'flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
            'opacity-0 group-hover:opacity-100',
            meta.bg, meta.border, meta.color,
            'hover:shadow-md'
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          {meta.actionLabel}
        </button>
      ) : mat.type === 'TEXT' || (!mat.content_url && mat.content_text) ? (
        <Link
          href={`/student/classes/${useParams().classId}/materials/${mat.id}`}
          className={cn(
            'flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
            'opacity-0 group-hover:opacity-100',
            meta.bg, meta.border, meta.color,
            'hover:shadow-md'
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Baca Artikel
        </Link>
      ) : mat.content_url && (
        <a
          href={mat.content_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
            'opacity-0 group-hover:opacity-100',
            meta.bg, meta.border, meta.color,
            'hover:shadow-md'
          )}
        >
          {cat === 'link' || cat === 'video'
            ? <ExternalLink className="h-3.5 w-3.5" />
            : <Download className="h-3.5 w-3.5" />
          }
          {meta.actionLabel}
        </a>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentClassDetailPage() {
  const params = useParams()
  const classId = params.classId as string

  const [cls, setCls] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notEnrolled, setNotEnrolled] = useState(false)
  const [allMaterials, setAllMaterials] = useState<MaterialItem[]>([])
  const [activeTab, setActiveTab] = useState<'materi' | 'ujian' | 'peringkat'>('materi')
  const [userId, setUserId] = useState<string>('')
  const [viewingMap, setViewingMap] = useState<MaterialItem | null>(null)
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(new Set())
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set())
  const [unlockedModuleIds, setUnlockedModuleIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', user.id)
        .single()

      if (!enrollment) {
        setNotEnrolled(true)
        setLoading(false)
        return
      }

      // Fetch class with materials and quizzes
      const { data: classData, error } = await supabase
        .from('classes')
        .select(`
          id, name, description, join_code,
          teacher:users!classes_teacher_id_fkey(name),
          modules(
            id, title, order,
            materials(id, title, type, content_url, content_text, order, created_at),
            quizzes(id, title, xp_reward, passing_score, order, created_at, quiz_type, max_attempts)
          )
        `)
        .eq('id', classId)
        .single()

      if (error || !classData) {
        setLoading(false)
        return
      }

      // Fetch completions
      const { data: completions } = await supabase
        .from('material_completions')
        .select('material_id')
        .eq('user_id', user.id)
      
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)

      // Fetch module unlocks (Teacher overrides)
      const { data: unlocks } = await supabase
        .from('module_unlocks')
        .select('module_id')
        .eq('user_id', user.id)

      const completedMaterialIds = new Set((completions ?? []).map(c => c.material_id))
      const unlockedModuleIds = new Set((unlocks ?? []).map(u => u.module_id))
      
      // Calculate max score per quiz
      const maxScores: Record<string, number> = {}
      ;(attempts ?? []).forEach(a => {
        if (!maxScores[a.quiz_id] || a.score > maxScores[a.quiz_id]) {
          maxScores[a.quiz_id] = a.score
        }
      })

      // We determine completed quizzes based on their passing_score
      const completedQuizIds = new Set<string>()
      
      // We need to iterate through all quizzes to check their passing_score
      ;(classData.modules ?? []).forEach((m: any) => {
        (m.quizzes ?? []).forEach((q: any) => {
          const maxScore = maxScores[q.id]
          const isPassed = maxScore !== undefined && maxScore >= (q.passing_score || 0)
          
          // Also mark as passed if the module it belongs to is manually unlocked?
          // Actually, the teacher override is meant to unlock the *next* module.
          // The visual representation in ExpeditionMap:
          // A node is completed if it's in `completedQuizzes`.
          // If a student hasn't passed the quiz, it won't be completed, so the NEXT node will be locked.
          // BUT wait! If the teacher unlocked the NEXT module, how does ExpeditionMap know?
          // ExpeditionMap just linearly locks everything after the first uncompleted node.
          
          // So if a quiz is not passed, but the teacher unlocked the NEXT module, we should probably 
          // treat the quiz as "completed" for the sake of the map progression, OR we modify ExpeditionMap
          // to understand module unlocks.
          
          // Let's modify ExpeditionMap to accept `unlockedModules`.
          if (isPassed) {
            completedQuizIds.add(q.id)
          }
        })
      })

      const teacher = Array.isArray(classData.teacher)
        ? classData.teacher[0]
        : classData.teacher

      const processed = {
        ...classData,
        teacher,
        modules: (classData.modules ?? []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
      }

      // Flatten all materials sorted by created_at
      const flat = (classData.modules ?? [])
        .flatMap((m: { materials: MaterialItem[] }) => m.materials ?? [])
        .sort((a: MaterialItem, b: MaterialItem) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

      setCls(processed as ClassInfo)
      setAllMaterials(flat)
      setCompletedMaterials(completedMaterialIds)
      setCompletedQuizzes(completedQuizIds)
      setUnlockedModuleIds(unlockedModuleIds)
      setLoading(false)
    }

    fetchData()
  }, [classId])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full p-5 lg:p-7">
        <Skeleton className="mb-6 h-5 w-40" />
        <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Not enrolled ───────────────────────────────────────────────────────────
  if (notEnrolled) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center max-w-sm">
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-sm font-semibold text-orange-600">Kamu belum terdaftar di kelas ini</p>
          <p className="mt-2 text-xs text-slate-500">Enroll kelas terlebih dahulu untuk mengakses materi</p>
          <Link
            href="/student/classes"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Kelas
          </Link>
        </div>
      </div>
    )
  }

  if (!cls) return null

  return (
    <div className="min-h-full p-5 lg:p-7">
      <OnboardingTour tourKey="class_detail_student_v3" steps={classDetailStudentSteps} />
      {/* Back */}
      <Link
        href="/student/classes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Kelas
      </Link>

      {/* Class Header */}
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl font-black text-white shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
            {cls.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">{cls.name}</h1>
            {cls.description && (
              <p className="mt-2 text-sm text-indigo-100/80 max-w-2xl leading-relaxed">{cls.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {cls.teacher && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100 backdrop-blur-md">
                  <GraduationCap className="h-4 w-4 text-blue-300" />
                  <span>{cls.teacher.name}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-indigo-100 backdrop-blur-md">
                <Hash className="h-3 w-3 text-emerald-300" />
                {cls.join_code}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-100 backdrop-blur-md">
                <BookOpen className="h-3.5 w-3.5 text-amber-300" />
                {allMaterials.length} materi tersedia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex items-center justify-center px-4">
        <div className="w-full max-w-sm sm:max-w-xl lg:max-w-2xl flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab('materi')}
            className={cn(
              'flex-1 flex justify-center items-center gap-2 rounded-full px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300',
              activeTab === 'materi'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80'
            )}
          >
            <BookOpen className={cn("h-4 w-4", activeTab === 'materi' ? "text-blue-200" : "text-slate-400")} />
            Materi
          </button>

          <button
            onClick={() => setActiveTab('ujian')}
            className={cn(
              'flex-1 flex justify-center items-center gap-2 rounded-full px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300',
              activeTab === 'ujian'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/25 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80'
            )}
          >
            <FileText className={cn("h-4 w-4", activeTab === 'ujian' ? "text-red-200" : "text-slate-400")} />
            Ujian Akhir
          </button>

          <button
            id="tour-student-class-leaderboard"
            onClick={() => setActiveTab('peringkat')}
            className={cn(
              'w-1/2 flex justify-center items-center gap-2 rounded-full px-4 sm:px-6 py-2.5 text-sm sm:text-base font-semibold transition-all duration-300',
              activeTab === 'peringkat'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80'
            )}
          >
            <Trophy className={cn("h-4 w-4", activeTab === 'peringkat' ? "text-amber-200" : "text-slate-400")} />
            Peringkat
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'materi' && (
        allMaterials.length === 0 ? (
          <div id="tour-student-class-modules" className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-28 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-50">
              <BookOpen className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Belum ada materi</p>
            <p className="mt-1.5 text-xs text-slate-600">
              Guru belum mengunggah materi untuk kelas ini
            </p>
          </div>
        ) : (
          <div id="tour-student-class-modules" className="w-full">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-center mt-4">
              🗺️ Peta Ekspedisi
            </h2>
            <ExpeditionMap 
              modules={cls.modules.map(m => ({
                ...m,
                quizzes: m.quizzes?.filter(q => !q.quiz_type || q.quiz_type === 'FORMATIF') || []
              }))} 
              completedMaterials={completedMaterials}
              completedQuizzes={completedQuizzes}
              unlockedModules={unlockedModuleIds}
              classId={classId}
            />
          </div>
        )
      )}

      {activeTab === 'ujian' && (
        <div className="w-full max-w-4xl mx-auto mt-4">
          <div className="mb-6 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 p-8 text-center text-white shadow-lg">
            <FileText className="mb-3 h-12 w-12 text-red-200" />
            <h2 className="text-2xl font-black">Ujian Akhir (Sumatif)</h2>
            <p className="mt-2 text-sm text-red-100 max-w-lg">
              Evaluasi akhir yang mencakup seluruh materi di kelas ini. Kerjakan dengan teliti karena ini sangat berpengaruh pada nilai akhir Anda!
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cls.modules.flatMap(m => m.quizzes || [])
              .filter(q => q.quiz_type === 'SUMATIF')
              .map(quiz => {
                const isCompleted = completedQuizzes.has(quiz.id)
                return (
                  <Link
                    key={quiz.id}
                    href={`/student/quizzes/${quiz.id}`}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-red-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-red-700">UJIAN SUMATIF</span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle className="h-3 w-3" /> Selesai
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 font-bold text-slate-800">{quiz.title}</h3>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Trophy className="h-4 w-4 text-amber-400" />
                        {quiz.xp_reward} XP
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                        Mulai Ujian &rarr;
                      </div>
                    </div>
                  </Link>
                )
            })}
            {cls.modules.flatMap(m => m.quizzes || []).filter(q => q.quiz_type === 'SUMATIF').length === 0 && (
              <div className="col-span-full py-12 text-center text-sm font-semibold text-slate-500">
                Belum ada Ujian Akhir untuk kelas ini.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'peringkat' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ClassLeaderboard classId={classId} />
        </div>
      )}

      {/* Map Viewer */}
      {viewingMap && (
        <InteractiveMapViewer
          title={viewingMap.title}
          dataString={viewingMap.content_text}
          onClose={() => setViewingMap(null)}
        />
      )}
    </div>
  )
}
