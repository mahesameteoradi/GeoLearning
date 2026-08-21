import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookMarked, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { ClassesClient } from '@/components/teacher/ClassesClient'

export const metadata: Metadata = {
  title: 'GeoLearning — My Classes',
  description: 'Kelola kelas dan materi pembelajaran Anda',
}

export const dynamic = 'force-dynamic'

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
      id, name, description, join_code, gamification_mode,
      modules(id),
      class_students(student_id)
    `)
    .eq('teacher_id', user.id)
    .order('name', { ascending: true })

  // Deduplicate students across all teacher's classes
  const uniqueStudentIds = new Set<string>()
  if (rawClasses) {
    rawClasses.forEach(cls => {
      cls.class_students.forEach((cs: any) => uniqueStudentIds.add(cs.student_id))
    })
  }
  const totalStudents = uniqueStudentIds.size

  const classes = (rawClasses ?? []).map((cls) => ({
    id: cls.id,
    name: cls.name,
    description: cls.description,
    join_code: cls.join_code,
    gamification_mode: cls.gamification_mode,

    moduleCount: (cls.modules as { id: string }[]).length,
    studentCount: (cls.class_students as { student_id: string }[]).length,
  }))

  const totalModules = classes.reduce((sum, c) => sum + c.moduleCount, 0)

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Page Header */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#0B1120] p-8 shadow-md border border-slate-800">
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <BookMarked className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Manajemen Kelas
              </h1>
              <p className="mt-1.5 text-blue-100/80 max-w-xl text-sm leading-relaxed">
                Pantau dan kelola seluruh kelas serta peserta didik Anda dari satu tempat.
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
