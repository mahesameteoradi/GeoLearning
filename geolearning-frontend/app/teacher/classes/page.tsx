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
      id, name, description, join_code,
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
    moduleCount: (cls.modules as { id: string }[]).length,
    studentCount: (cls.class_students as { id: string }[]).length,
  }))

  const totalModules = classes.reduce((sum, c) => sum + c.moduleCount, 0)

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BookMarked className="h-5 w-5 text-blue-600" />
            My Classes
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola kelas, modul, dan kode bergabung siswa
          </p>
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
