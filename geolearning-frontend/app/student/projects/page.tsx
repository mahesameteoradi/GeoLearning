'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookMarked, Clock, CheckCircle, ArrowRight, Zap, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { projectsStudentSteps } from '@/lib/utils/tourSteps'
import { AnimatedFilterTabs } from '@/components/ui/AnimatedFilterTabs'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL')

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
          id, title, description, deadline, xp_reward, is_group_project, created_at,
          class_id,
          class:classes(name),
          submissions:project_submissions(id, user_id, file_url, notes, score, xp_earned, graded_at, submitted_at, group_members)
        `)
        .in('class_id', classIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      // Filter submissions for this user
      const formatted = (pData ?? []).map(p => {
        const mySub = p.submissions.find((s: any) => {
          if (s.user_id === user.id) return true;
          if (s.group_members) {
            try {
              const parsed = typeof s.group_members === 'string' ? JSON.parse(s.group_members) : s.group_members;
              if (Array.isArray(parsed) && parsed.includes(user.id)) return true;
              if (parsed && parsed.members && Array.isArray(parsed.members) && parsed.members.includes(user.id)) return true;
            } catch (e) {}
          }
          return false;
        });

        return {
          ...p,
          submission: mySub || null
        }
      })

      setProjects(formatted)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <OnboardingTour tourKey="projects_student" steps={projectsStudentSteps} />
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#0B1120] p-8 shadow-md border border-slate-800">
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Tugas Proyek</h1>
            <p className="mt-1.5 text-blue-100/80 max-w-xl text-sm leading-relaxed">
              Kerjakan dan kumpulkan tugas proyek dari gurumu. Jangan sampai terlewat tenggat waktu!
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex">
        <AnimatedFilterTabs
          activeTab={filterStatus}
          onChange={(tab) => setFilterStatus(tab as 'ALL' | 'PENDING' | 'DONE')}
          options={[
            { id: 'ALL', label: 'Semua Proyek' },
            { id: 'PENDING', label: 'Belum Selesai' },
            { id: 'DONE', label: 'Sudah Selesai' }
          ]}
          layoutId="student-projects-filter"
        />
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden min-h-[220px]">
              <div className="flex items-start justify-between mb-4">
                <div className="h-6 w-24 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-6 w-20 bg-slate-200 rounded-lg animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded-md mb-2 animate-pulse" />
              <div className="h-4 w-full bg-slate-50 rounded-md mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-slate-50 rounded-md mb-4 animate-pulse" />
              <div className="mt-auto flex items-center justify-between">
                <div className="h-6 w-20 bg-slate-50 rounded-md animate-pulse" />
                <div className="h-8 w-24 bg-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div id="tour-student-project-list" className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Tugas Proyek</h3>
          <p className="mt-1 text-xs text-slate-500">Belum ada tugas yang dipublikasikan oleh gurumu.</p>
        </div>
      ) : (
        <div id="tour-student-project-list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {projects.filter(p => filterStatus === 'ALL' || (filterStatus === 'DONE' ? !!p.submission : !p.submission)).map(proj => {
              const sub = proj.submission
              const isLate = proj.deadline && !sub && new Date() > new Date(proj.deadline)

              return (
                <motion.div 
                  key={proj.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:shadow-md hover:scale-[1.02] hover:border-blue-300"
                >
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">
                    {proj.class?.name || 'Unknown Class'}
                  </span>
                  <div className="flex items-center gap-2">
                    {proj.is_group_project && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                        Kelompok
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      <Zap className="h-3 w-3" />
                      Max {proj.xp_reward} XP
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1 relative z-10 line-clamp-2">{proj.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1 relative z-10">{proj.description}</p>
                
                <div className="space-y-2 mb-5 relative z-10">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className={cn("h-4 w-4", isLate ? "text-red-500" : "text-blue-500")} />
                    <span className={cn(isLate && "text-red-600 font-semibold")}>
                      Tenggat: {proj.deadline ? new Date(proj.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tidak ada'}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-auto">
                  {sub ? (
                    <div className="flex flex-col gap-1 w-full">
                       <div className="flex items-center justify-between w-full">
                         <span className="text-[11px] font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                           <CheckCircle className="h-3.5 w-3.5" /> Terkumpul
                         </span>
                         {sub.score !== null ? (
                           <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                             Nilai: {sub.score}
                           </span>
                         ) : (
                           <span className="text-[10px] font-semibold text-slate-500">
                             Menunggu Penilaian
                           </span>
                         )}
                       </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Belum dikerjakan</p>
                  )}
                  
                  <Link
                    href={`/student/projects/${proj.id}`}
                    className={cn(
                      'ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300',
                      sub
                        ? 'bg-green-50 text-green-600 hover:bg-green-100 group-hover:scale-105'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 group-hover:scale-105 group-hover:shadow-blue-500/30'
                    )}
                  >
                    Lihat Detail
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                
                {/* Clickable Card Link */}
                <Link href={`/student/projects/${proj.id}`} className="absolute inset-0 z-0 rounded-2xl">
                  <span className="sr-only">Detail {proj.title}</span>
                </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
