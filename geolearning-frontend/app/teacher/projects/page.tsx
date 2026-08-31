'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookMarked, Plus, FileText, CheckCircle, Clock, Edit2, Trash2, Loader2, Send } from 'lucide-react'
import { CreateProjectModal } from '@/components/teacher/CreateProjectModal'
import { EditProjectModal } from '@/components/teacher/EditProjectModal'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { projectsTeacherSteps } from '@/lib/utils/tourSteps'
import { AnimatedFilterTabs } from '@/components/ui/AnimatedFilterTabs'
import { motion, AnimatePresence } from 'framer-motion'

export default function TeacherProjectsPage() {
  const { confirm } = useConfirm()
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')

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
    const isConfirmed = await confirm({
      title: 'Hapus Tugas',
      message: `Apakah Anda yakin ingin menghapus tugas "${title}"?`,
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    
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

  const handlePublish = async (id: string, title: string) => {
    const isConfirmed = await confirm({
      title: 'Publish Tugas',
      message: `Apakah Anda yakin ingin mempublish tugas "${title}"? Tugas yang sudah di-publish akan langsung terlihat oleh siswa.`,
      confirmText: 'Ya, Publish',
    })
    if (!isConfirmed) return
    
    setPublishingId(id)
    try {
      const { error } = await supabase.from('project_assignments').update({ is_published: true }).eq('id', id)
      if (error) throw error
      toast.success('Tugas berhasil dipublish')
      loadData()
    } catch (err: any) {
      toast.error(`Gagal mempublish tugas: ${err.message}`)
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="min-h-screen p-5 lg:p-7">
      <OnboardingTour tourKey="projects_teacher" steps={projectsTeacherSteps} />
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#0B1120] p-8 shadow-md border border-slate-800">
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <BookMarked className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Penugasan Proyek
              </h1>
              <p className="mt-1.5 text-blue-100/80 max-w-xl text-sm leading-relaxed">
                Berikan tugas proyek, bentuk kelompok, dan evaluasi hasil kerja siswa secara efisien.
              </p>
            </div>
          </div>
          <button
            id="tour-teacher-create-project"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:shadow-blue-600/50 hover:from-blue-400 hover:to-blue-500"
          >
            <Plus className="h-5 w-5" />
            Buat Tugas
          </button>
        </div>
      </div>

      <div className="mb-6 flex">
        <AnimatedFilterTabs
          activeTab={filterStatus}
          onChange={(tab) => setFilterStatus(tab as 'ALL' | 'PUBLISHED' | 'DRAFT')}
          options={[
            { id: 'ALL', label: 'Semua Tugas' },
            { id: 'PUBLISHED', label: 'Published' },
            { id: 'DRAFT', label: 'Draft' }
          ]}
          layoutId="projects-filter-tab"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Memuat data tugas...</div>
      ) : projects.length === 0 ? (
        <div id="tour-teacher-project-list" className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Tugas Proyek</h3>
          <p className="mt-1 text-xs text-slate-500 mb-4">Buat tugas pertama Anda untuk mulai memberikan proyek.</p>
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-100 text-blue-600 px-4 py-2 text-xs font-bold hover:bg-blue-200">
            Buat Tugas Sekarang
          </button>
        </div>
      ) : (
        <div id="tour-teacher-project-list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {projects.filter(p => filterStatus === 'ALL' || (filterStatus === 'PUBLISHED' ? p.is_published : !p.is_published)).map(proj => {
              const submissions = proj.submissions || []
              const gradedCount = submissions.filter((s: any) => s.score !== null).length
              
              return (
                <motion.div 
                  key={proj.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-900/5 hover:-translate-y-1"
                >
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-50 blur-3xl transition-all duration-500 group-hover:bg-blue-100 group-hover:scale-150" />
                <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                      proj.is_published ? "bg-green-50 text-green-600 border border-green-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                    )}>
                      {proj.is_published ? 'Published' : 'Draft'}
                    </span>
                    {proj.is_group_project && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                        Kelompok
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded-md">
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
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    <span>{submissions.length} Pengumpulan</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>{gradedCount} Telah dinilai</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={`/teacher/projects/${proj.id}`}
                    className="flex-1 text-center rounded-xl bg-slate-50 border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  >
                    Lihat Pengumpulan
                  </a>
                  {!proj.is_published && (
                    <button
                      onClick={() => handlePublish(proj.id, proj.title)}
                      disabled={publishingId === proj.id}
                      className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors disabled:opacity-50"
                      title="Publish Tugas"
                    >
                      {publishingId === proj.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  )}
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
                </motion.div>
              )
            })}
          </AnimatePresence>
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
