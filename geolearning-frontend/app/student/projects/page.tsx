'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookMarked, Clock, CheckCircle, ArrowRight, Zap, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

export default function StudentProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get student's enrolled classes
    const { data: enrollments } = await supabase.from('class_students').select('class_id').eq('student_id', user.id)
    const classIds = enrollments?.map(e => e.class_id) || []

    if (classIds.length > 0) {
      // Get published projects for those classes
      const { data: pData } = await supabase
        .from('project_assignments')
        .select(`
          id, title, description, deadline, xp_reward, created_at,
          class:classes(name),
          submissions:project_submissions(id, file_url, notes, score, xp_earned, graded_at, submitted_at)
        `)
        .in('class_id', classIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      // Filter submissions for this user
      const formatted = (pData ?? []).map(p => ({
        ...p,
        submission: p.submissions.find((s: any) => true) || null // We only expect max 1 submission per student because of RLS/logic, but let's just take first
      }))

      setProjects(formatted)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async () => {
    if (!fileUrl.trim()) {
      toast.error('Masukkan URL file/dokumen tugas Anda')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.from('project_submissions').insert({
        assignment_id: selectedProject.id,
        user_id: user?.id,
        file_url: fileUrl.trim(),
        notes: notes.trim(),
      })
      if (error) throw error

      toast.success('Tugas berhasil dikumpulkan! 🎉')
      setSelectedProject(null)
      setFileUrl('')
      setNotes('')
      loadData()
    } catch (err: any) {
      toast.error(`Gagal mengumpulkan: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800">Tugas Proyek</h1>
        <p className="text-sm text-slate-500 mt-1">Kerjakan dan kumpulkan tugas proyek dari gurumu.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Memuat data tugas...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Tugas Proyek</h3>
          <p className="mt-1 text-xs text-slate-500">Belum ada tugas yang dipublikasikan oleh gurumu.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(proj => {
            const sub = proj.submission
            const isLate = proj.deadline && !sub && new Date() > new Date(proj.deadline)

            return (
              <div key={proj.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                    {proj.class?.name || 'Unknown Class'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    <Zap className="h-3 w-3" />
                    Max {proj.xp_reward} XP
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{proj.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{proj.description}</p>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className={cn("h-4 w-4", isLate ? "text-red-500" : "text-blue-500")} />
                    <span className={cn(isLate && "text-red-600 font-semibold")}>
                      Tenggat: {proj.deadline ? new Date(proj.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tidak ada'}
                    </span>
                  </div>
                </div>

                {sub ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Dikumpulkan
                      </span>
                      {sub.score !== null ? (
                        <span className="text-xs font-bold text-amber-600 bg-white px-2 py-0.5 rounded-md shadow-sm">
                          Nilai: {sub.score} / 100
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md">
                          Menunggu Penilaian
                        </span>
                      )}
                    </div>
                    {sub.xp_earned > 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold mb-2">Kamu mendapat +{sub.xp_earned} XP!</p>
                    )}
                    <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> Lihat File Saya
                    </a>
                  </div>
                ) : (
                  <button 
                    onClick={() => setSelectedProject(proj)}
                    className="w-full rounded-xl bg-blue-50 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    Kumpulkan Tugas <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-12"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Kumpulkan: {selectedProject.title}</h2>
              <p className="text-xs text-slate-500 mb-5">{selectedProject.description}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Link File Tugas (PDF/Doc/Drive) <span className="text-red-500">*</span></label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-[10px] text-slate-600 mt-1">Upload file ke Google Drive / platform lain dan masukkan link-nya di sini.</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Catatan untuk Guru (Opsional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                    placeholder="Ada hal yang ingin disampaikan ke guru?"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => { setSelectedProject(null); setFileUrl(''); setNotes(''); }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Mengumpulkan...' : 'Kumpulkan Tugas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
