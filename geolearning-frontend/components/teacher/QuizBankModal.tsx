import { useState, useEffect } from 'react'
import { X, Search, FileText, CheckCircle2, Clock, Trophy, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface QuizItem {
  id: string
  title: string
  time_limit: number | null
  xp_reward: number
  passing_score: number | null
  question_count: number
}

interface QuizBankModalProps {
  classId: string
  targetModuleId: string
  existingModules: { id: string; title: string }[]
  nextOrderMap?: Record<string, number>
  onClose: () => void
  onSuccess: () => void
}

export function QuizBankModal({ classId, targetModuleId: initialModuleId, existingModules, nextOrderMap = {}, onClose, onSuccess }: QuizBankModalProps) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cloningId, setCloningId] = useState<string | null>(null)
  
  const [targetModuleId, setTargetModuleId] = useState(initialModuleId)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [quizOrder, setQuizOrder] = useState<number>(nextOrderMap[initialModuleId] || 0)
  const { confirm } = useConfirm()

  // Update order when module changes
  useEffect(() => {
    if (targetModuleId !== 'new') {
      setQuizOrder(nextOrderMap[targetModuleId] || 0)
    } else {
      setQuizOrder(0)
    }
  }, [targetModuleId, nextOrderMap])

  const supabase = createClient()

  useEffect(() => {
    fetchBankQuizzes()
  }, [])

  const fetchBankQuizzes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id, title, time_limit, xp_reward, passing_score, quiz_type,
          questions(id)
        `)
        .eq('teacher_id', user.id)
        .is('class_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setQuizzes(data.map((q: any) => ({
        id: q.id,
        title: q.title,
        time_limit: q.time_limit,
        xp_reward: q.xp_reward,
        passing_score: q.passing_score,
        quiz_type: q.quiz_type,
        question_count: q.questions?.length ?? 0
      })))
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat Bank Kuis')
    } finally {
      setLoading(false)
    }
  }

  const handleClone = async (quiz: QuizItem) => {
    if (!targetModuleId) {
      toast.error('Pilih Bab/Modul tujuan')
      return
    }

    const isConfirmed = await confirm({
      title: 'Konfirmasi Penambahan Kuis',
      message: `Apakah Anda yakin ingin menambahkan kuis "${quiz.title}" ke kelas ini?`,
      confirmText: 'Ya, Tambahkan',
      cancelText: 'Batal'
    })

    if (!isConfirmed) return

    setCloningId(quiz.id)
    const tid = toast.loading('Mengambil kuis dari bank...')

    try {
      let finalModuleId = targetModuleId
      
      // If "new", create new module first
      if (targetModuleId === 'new') {
        if (!newModuleTitle.trim()) {
          toast.error('Nama bab/modul baru wajib diisi', { id: tid })
          setCloningId(null)
          return
        }
        const newModId = crypto.randomUUID()
        const { error: modErr } = await supabase.from('modules').insert({
          id: newModId,
          class_id: classId,
          title: newModuleTitle.trim(),
          order: existingModules.length,
          updated_at: new Date().toISOString()
        })
        if (modErr) throw modErr
        finalModuleId = newModId
      }

      // Fetch the full quiz and questions
      const { data: fullQuiz, error: fetchErr } = await supabase
        .from('quizzes')
        .select('*, questions(*)')
        .eq('id', quiz.id)
        .single()

      if (fetchErr) throw fetchErr

      // Clone Quiz
      const newQuizId = crypto.randomUUID()
      const { questions, id, class: _, module: __, teacher: ___, ...quizDataToCopy } = fullQuiz
      
      const { error: insertErr } = await supabase.from('quizzes').insert({
        ...quizDataToCopy,
        id: newQuizId,
        class_id: classId,
        module_id: finalModuleId,
        teacher_id: null, // Once cloned into a class, it belongs to that class (not bank)
        is_published: false, // Draft by default in the new class
        order: quizOrder
      })

      if (insertErr) throw insertErr

      // Clone Questions
      if (questions && questions.length > 0) {
        const newQuestions = questions.map((q: any) => {
          const { id: oldId, quiz_id, ...qData } = q
          return {
            ...qData,
            id: crypto.randomUUID(),
            quiz_id: newQuizId
          }
        })
        
        const { error: qErr } = await supabase.from('questions').insert(newQuestions)
        if (qErr) throw qErr
      }

      toast.success('Kuis berhasil ditambahkan ke kelas!', { id: tid })
      onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(`Gagal: ${err.message}`, { id: tid })
      setCloningId(null)
    }
  }

  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex h-full max-h-[800px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-slate-800">Ambil dari Bank Kuis</h2>
            <p className="text-sm text-slate-500 mt-1">Pilih template kuis yang ingin disalin ke kelas ini</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
          
          {/* Target Module Selection */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <h3 className="text-sm font-bold text-indigo-900 mb-3">Tujuan Kuis</h3>
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-500/70 mb-1.5 block">
                  Pilih Bab / Modul
                </label>
                <select
                  value={targetModuleId}
                  onChange={e => setTargetModuleId(e.target.value)}
                  className="w-full rounded-xl border border-white bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-600/10"
                >
                  <option value="">-- Pilih --</option>
                  {existingModules.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                  <option value="new">+ Buat Bab / Modul Baru</option>
                </select>
              </div>
              
              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-500/70 mb-1.5 block">
                  Urutan
                </label>
                <input
                  type="number"
                  min="0"
                  value={quizOrder}
                  onChange={e => setQuizOrder(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-600/10"
                />
              </div>
              
              {targetModuleId === 'new' && (
                <div className="animate-in fade-in slide-in-from-top-1 sm:col-span-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-500/70 mb-1.5 block">
                    Nama Modul Baru
                  </label>
                  <input
                    value={newModuleTitle}
                    onChange={e => setNewModuleTitle(e.target.value)}
                    placeholder="Ketik nama modul..."
                    className="w-full rounded-xl border border-white bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-600/10"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kuis di bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
            />
          </div>

          {/* Quiz List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-4 text-sm text-slate-500">Memuat bank kuis...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">Tidak ada kuis ditemukan.</p>
              <p className="text-xs text-slate-400 mt-1">Buat template kuis di halaman Manajemen Kuis.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map(quiz => (
                <div key={quiz.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                  <h4 className="font-bold text-slate-800 line-clamp-1 mb-2">{quiz.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {quiz.question_count} Soal</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {quiz.time_limit ? `${quiz.time_limit} detik` : '∞'}</span>
                    <span className="flex items-center gap-1 text-emerald-500"><Trophy className="h-3 w-3" /> {quiz.passing_score} KKM</span>
                    {quiz.quiz_type === 'SUMATIF' && (
                      <span className="flex items-center gap-1 text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">SUMATIF</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleClone(quiz)}
                    disabled={!!cloningId}
                    className={cn(
                      "mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-all",
                      cloningId === quiz.id
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                    )}
                  >
                    {cloningId === quiz.id ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Menyalin...</>
                    ) : (
                      'Pilih Kuis Ini'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
