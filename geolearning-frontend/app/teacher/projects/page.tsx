'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookMarked, Plus, FileText, CheckCircle, Clock, Edit2, Trash2, Loader2 } from 'lucide-react'
import { CreateProjectModal } from '@/components/teacher/CreateProjectModal'
import { EditProjectModal } from '@/components/teacher/EditProjectModal'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

export default function TeacherProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: cData } = await supabase.from('classes').select('id, name').eq('teacher_id', user.id)
    setClasses(cData ?? [])

    const classIds = cData?.map(c => c.id) || []
    if (classIds.length > 0) {
      const { data: pData } = await supabase
        .from('project_assignments')
        .select(`
          id, title, description, deadline, xp_reward, is_published, is_group_project, created_at,
          class:classes(name),
          submissions:project_submissions(id, score)
        `)
        .in('class_id', classIds)
        .order('created_at', { ascending: false })

      setProjects(pData ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tugas "${title}"?`)) return
    
    setDeletingId(id)
    try {
      const { error } = await supabase.from('project_assignments').delete().eq('id', id)
      if (error) throw error
      toast.success('Tugas berhasil dihapus')
      loadData()
    } catch (err: any) {
      toast.error(`Gagal menghapus tugas: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen p-5 lg:p-7">
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <BookMarked className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Penugasan Proyek
              </h1>
              <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">
                Kelola tugas proyek, bentuk kelompok, dan berikan evaluasi terstruktur kepada siswa.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:shadow-blue-600/50 hover:from-blue-400 hover:to-indigo-500"
          >
            <Plus className="h-5 w-5" />
            Buat Tugas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Memuat data tugas...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Tugas Proyek</h3>
          <p className="mt-1 text-xs text-slate-500 mb-4">Buat tugas pertama Anda untuk mulai memberikan proyek.</p>
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-100 text-blue-600 px-4 py-2 text-xs font-bold hover:bg-blue-200">
            Buat Tugas Sekarang
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(proj => {
            const submissions = proj.submissions || []
            const gradedCount = submissions.filter((s: any) => s.score !== null).length
            
            return (
              <div key={proj.id} className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1">
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 blur-3xl transition-all duration-500 group-hover:bg-indigo-100 group-hover:scale-150" />
                <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                      proj.is_published ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                    )}>
                      {proj.is_published ? 'Published' : 'Draft'}
                    </span>
                    {proj.is_group_project && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-violet-50 text-violet-600 border border-violet-200">
                        Kelompok
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-md">
                    {proj.class?.name || 'Unknown Class'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{proj.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{proj.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>Tenggat: {proj.deadline ? new Date(proj.deadline).toLocaleDateString('id-ID', { dateStyle: 'medium'}) : 'Tidak ada'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FileText className="h-3.5 w-3.5 text-violet-500" />
                    <span>{submissions.length} Pengumpulan</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{gradedCount} Telah dinilai</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={`/teacher/projects/${proj.id}`}
                    className="flex-1 text-center rounded-xl bg-slate-50 border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    Lihat Pengumpulan
                  </a>
                  <button
                    onClick={() => setEditingProject(proj)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                    title="Edit Tugas"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id, proj.title)}
                    disabled={deletingId === proj.id}
                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
                    title="Hapus Tugas"
                  >
                    {deletingId === proj.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal 
          classes={classes} 
          onClose={() => setShowCreate(false)} 
          onSaved={loadData} 
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          classes={classes}
          onClose={() => setEditingProject(null)}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
