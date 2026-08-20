import { useState, useEffect } from 'react'
import { X, Clock, Trophy, FileText, CheckCircle2, XCircle, Trash2, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface QuizDetailModalProps {
  quizId: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
}

export function QuizDetailModal({ quizId, onClose, onEdit, onDelete, onTogglePublish }: QuizDetailModalProps) {
  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quizzes')
        .select('*, questions(*)')
        .eq('id', quizId)
        .single()
      setQuiz(data)
      setLoading(false)
    }
    load()
  }, [quizId])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex items-center justify-center rounded-3xl bg-white p-10 shadow-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        </div>
      </div>
    )
  }

  if (!quiz) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex h-full max-h-[800px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="pr-10">
            <div className="flex items-center gap-3 mb-2">
              <span className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                quiz.is_published 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              )}>
                {quiz.is_published ? <><CheckCircle2 className="h-3.5 w-3.5" /> Published</> : <><XCircle className="h-3.5 w-3.5" /> Draft</>}
              </span>
              <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Template Bank Kuis
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-800">{quiz.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah Soal</span>
              <span className="text-xl font-black text-slate-800 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-500" /> {quiz.questions?.length || 0}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Waktu / Soal (Detik)</span>
              <span className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock className="h-5 w-5 text-indigo-500" /> {quiz.time_limit || '∞'}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Poin KKM</span>
              <span className="text-xl font-black text-slate-800 flex items-center gap-2"><Trophy className="h-5 w-5 text-indigo-500" /> {quiz.passing_score || 0}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">XP Reward</span>
              <span className="text-xl font-black text-slate-800 flex items-center gap-2">⭐ {quiz.xp_reward || 0}</span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold text-slate-800">Daftar Soal</h3>
            <div className="space-y-3">
              {(quiz.questions || []).map((q: any, i: number) => (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 mb-2">{q.text}</p>
                      {q.image_url && <img src={q.image_url} alt="Soal" className="mb-3 max-h-32 rounded-lg border border-slate-200 object-cover" />}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {q.type === 'MULTIPLE_CHOICE' ? (
                          (q.options as any[]).map((opt) => (
                            <div key={opt.label} className={cn(
                              "rounded-lg border px-3 py-2 text-xs font-medium",
                              opt.label === q.correct_answer ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" : "bg-slate-50 border-slate-100 text-slate-600"
                            )}>
                              {opt.label}. {opt.value}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                            <strong>Soal Peta (GeoGuessr)</strong>
                            <br />Target Lat: {q.options?.target_lat}, Lng: {q.options?.target_lng}
                            <br />Toleransi: {q.options?.radius_toleransi_meter} meter
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!quiz.questions || quiz.questions.length === 0) && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  Belum ada soal.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white p-4 px-6">
          <button onClick={onDelete} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" /> Hapus Kuis
          </button>
          
          <div className="flex gap-3">
            <button onClick={onTogglePublish} className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200">
              {quiz.is_published ? 'Ubah ke Draft' : 'Publish Kuis'}
            </button>
            <button onClick={() => { onClose(); onEdit(); }} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:-translate-y-0.5">
              <Edit className="h-4 w-4" /> Edit Kuis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
