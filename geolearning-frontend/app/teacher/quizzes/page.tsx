'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, FileText, CheckCircle2, XCircle, LayoutGrid, Clock, Trophy, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { QuizEditorModal } from '@/components/teacher/QuizEditorModal'
import { QuizDetailModal } from '@/components/teacher/QuizDetailModal'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { AnimatedFilterTabs } from '@/components/ui/AnimatedFilterTabs'

interface QuizItem {
  id: string
  title: string
  time_limit: number | null
  xp_reward: number
  is_published: boolean
  created_at: string
  passing_score: number | null
  quiz_type?: 'FORMATIF' | 'SUMATIF'
  max_attempts?: number
  question_count: number
}

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')
  const [showEditor, setShowEditor] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null)
  const [selectedDetailQuiz, setSelectedDetailQuiz] = useState<QuizItem | null>(null)
  const { confirm } = useConfirm()

  const supabase = createClient()

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch ONLY Bank Quizzes (class_id is null) for this teacher
      const { data: rawQuizzes, error } = await supabase
        .from('quizzes')
        .select(`
          id, title, time_limit, xp_reward, is_published, created_at,
          passing_score, quiz_type, max_attempts,
          questions(id)
        `)
        .eq('teacher_id', user.id)
        .is('class_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching quizzes:', error)
        toast.error('Gagal memuat bank kuis')
        return
      }

      const mapped: QuizItem[] = (rawQuizzes ?? []).map((q: any) => ({
        id: q.id,
        title: q.title,
        time_limit: q.time_limit,
        xp_reward: q.xp_reward,
        is_published: q.is_published,
        created_at: q.created_at,
        passing_score: q.passing_score,
        quiz_type: q.quiz_type,
        max_attempts: q.max_attempts,
        question_count: q.questions?.length ?? 0
      }))

      setQuizzes(mapped)
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan tidak terduga')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (quizId: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Kuis',
      message: 'Hapus template kuis ini dari Bank Soal? Kuis yang sudah dikloning ke kelas tidak akan terhapus.',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return

    const tid = toast.loading('Menghapus...')
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId)
      if (error) throw error
      toast.success('Kuis dihapus', { id: tid })
      setQuizzes(quizzes.filter(q => q.id !== quizId))
      if (selectedDetailQuiz?.id === quizId) setSelectedDetailQuiz(null)
    } catch (err) {
      toast.error('Gagal menghapus', { id: tid })
    }
  }

  const handleTogglePublish = async (quizId: string, currentStatus: boolean) => {
    const tid = toast.loading(currentStatus ? 'Menyembunyikan...' : 'Mempublikasikan...')
    try {
      const newStatus = !currentStatus
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: newStatus })
        .eq('id', quizId)

      if (error) throw error
      
      const quizToToggle = quizzes.find(q => q.id === quizId)
      if (newStatus && quizToToggle) {
        // Auto publish all clones in classes that share the same title
        await supabase.from('quizzes')
          .update({ is_published: true })
          .eq('title', quizToToggle.title)
          .not('class_id', 'is', null)
      }
      
      setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, is_published: newStatus } : q))
      if (selectedDetailQuiz?.id === quizId) {
        setSelectedDetailQuiz({ ...selectedDetailQuiz, is_published: newStatus })
      }
      toast.success(newStatus ? 'Kuis dipublikasikan' : 'Kuis disembunyikan', { id: tid })
    } catch (err) {
      toast.error('Gagal memperbarui status', { id: tid })
    }
  }

  const filteredQuizzes = quizzes.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || (filterStatus === 'PUBLISHED' ? q.is_published : !q.is_published)
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bank Kuis</h1>
            <p className="mt-2 text-slate-500">
              Buat dan kelola template kuis Anda di sini. Kuis dari bank ini bisa diambil dan dipublikasikan ke kelas mana pun.
            </p>
          </div>
          
          <button
            onClick={() => { setEditingQuiz(null); setShowEditor(true) }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Buat Kuis Baru
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama kuis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </div>
          <AnimatedFilterTabs
            activeTab={filterStatus}
            onChange={(tab) => setFilterStatus(tab as 'ALL' | 'PUBLISHED' | 'DRAFT')}
            options={[
              { id: 'ALL', label: 'Semua' },
              { id: 'PUBLISHED', label: 'Published' },
              { id: 'DRAFT', label: 'Draft' }
            ]}
          />
        </div>

        {/* Quizzes List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-slate-500 font-medium">Memuat bank kuis...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 px-4 text-center shadow-sm">
            <div className="rounded-full bg-blue-50 p-4 mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Tidak Ada Kuis</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mb-6">
              Belum ada template kuis di Bank Soal Anda.
            </p>
            <button
              onClick={() => { setEditingQuiz(null); setShowEditor(true) }}
              className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600"
            >
              <Plus className="h-4 w-4" />
              Buat Kuis Sekarang
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredQuizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:shadow-blue-600/10 hover:border-blue-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <LayoutGrid className="h-6 w-6" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                      quiz.is_published 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-slate-50 text-slate-600 border border-slate-200"
                    )}>
                      {quiz.is_published ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Published</>
                      ) : (
                        <><XCircle className="h-3.5 w-3.5" /> Draft</>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {quiz.title}
                  </h3>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-6">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {quiz.question_count} Soal
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {quiz.time_limit ? `${quiz.time_limit} detik` : 'Tanpa waktu'}
                    </span>
                    <span className="flex items-center gap-1 text-green-500">
                      <Trophy className="h-3.5 w-3.5" />
                      {quiz.passing_score} KKM
                    </span>
                    {quiz.quiz_type === 'SUMATIF' && (
                      <span className="flex items-center gap-1 text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">SUMATIF</span>
                    )}
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="h-3.5 w-3.5" />
                      {quiz.xp_reward} XP
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedDetailQuiz(quiz)}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => { setEditingQuiz(quiz); setShowEditor(true) }}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {showEditor && (
        <QuizEditorModal
          quiz={editingQuiz ? { ...editingQuiz, class_id: null, module_id: null } : null}
          onClose={() => {
            setShowEditor(false)
            setEditingQuiz(null)
          }}
          onSaved={() => {
            setShowEditor(false)
            setEditingQuiz(null)
            fetchQuizzes()
          }}
        />
      )}

      {selectedDetailQuiz && (
        <QuizDetailModal
          quizId={selectedDetailQuiz.id}
          onClose={() => setSelectedDetailQuiz(null)}
          onEdit={() => {
            const q = quizzes.find(x => x.id === selectedDetailQuiz.id)
            if (q) {
              setEditingQuiz(q)
              setShowEditor(true)
            }
          }}
          onDelete={() => handleDelete(selectedDetailQuiz.id)}
          onTogglePublish={() => handleTogglePublish(selectedDetailQuiz.id, selectedDetailQuiz.is_published)}
        />
      )}
    </div>
  )
}

function Star(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
