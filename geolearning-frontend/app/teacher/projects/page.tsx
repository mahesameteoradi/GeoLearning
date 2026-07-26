'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookMarked, Plus, FileText, CheckCircle, Clock } from 'lucide-react'
import { CreateProjectModal } from '@/components/teacher/CreateProjectModal'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

export default function TeacherProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

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
          id, title, description, deadline, xp_reward, is_published, created_at,
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

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Tugas Proyek</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola tugas proyek dan berikan nilai kepada siswa.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Buat Tugas
        </button>
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
              <div key={proj.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                    proj.is_published ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                  )}>
                    {proj.is_published ? 'Published' : 'Draft'}
                  </span>
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

                <a 
                  href={`/teacher/projects/${proj.id}`}
                  className="block w-full text-center rounded-xl bg-slate-50 border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  Lihat Pengumpulan
                </a>
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
    </div>
  )
}
