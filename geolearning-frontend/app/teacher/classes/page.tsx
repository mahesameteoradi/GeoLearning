import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookMarked, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { ClassesClient } from '@/components/teacher/ClassesClient'

export const metadata: Metadata = {
  title: 'GeoLearning — My Classes',
  description: 'Kelola kelas dan materi pembelajaran Anda',
}

export default async function TeacherClassesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch teacher's classes with module + enrollment counts
  const { data: rawClasses } = await supabase
    .from('classes')
    .select(`
      id, name, description, join_code, flashcards,
      modules(id),
      class_students(id)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  // Total students across all enrolled classes (deduplicated)
  const { count: totalStudents } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT')

  const classes = (rawClasses ?? []).map((cls) => ({
    id: cls.id,
    name: cls.name,
    description: cls.description,
    join_code: cls.join_code,
    flashcards: cls.flashcards,
    moduleCount: (cls.modules as { id: string }[]).length,
    studentCount: (cls.class_students as { id: string }[]).length,
  }))

  const totalModules = classes.reduce((sum, c) => sum + c.moduleCount, 0)

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Page Header */}
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
                Manajemen Kelas
              </h1>
              <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">
                Kelola ruang belajar Anda, atur modul, dan distribusikan kode akses (*join code*) kepada siswa dengan mudah.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ClassesClient
        classes={classes}
        teacherId={user.id}
        totalStudents={totalStudents ?? 0}
        totalModules={totalModules}
      />
    </div>
  )
}
