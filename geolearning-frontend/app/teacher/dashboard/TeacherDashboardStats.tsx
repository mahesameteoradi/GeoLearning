'use server';

import { createClient } from '@/lib/supabase/server'
import { ClassCard } from '@/components/teacher/ClassCard'
import { StudentProgressTable } from '@/components/teacher/StudentProgressTable'
import { BarChart3, BookMarked, Users } from 'lucide-react'

export async function TeacherDashboardStats({ user, profile }: { user: any, profile: any }) {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id, name, description, join_code, flashcards, gamification_mode,
      modules(id),
      class_students(
        student:users!class_students_student_id_fkey(id, name, email, xp, current_streak, avatar_url)
      )
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const uniqueStudentsMap = new Map()
  if (classes) {
    for (const cls of classes) {
      if (cls.class_students) {
        for (const cs of cls.class_students) {
          const student = Array.isArray(cs.student) ? cs.student[0] : cs.student
          if (student && !uniqueStudentsMap.has(student.id)) {
            uniqueStudentsMap.set(student.id, student)
          }
        }
      }
    }
  }
  const allStudents = Array.from(uniqueStudentsMap.values())
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 50)

  const totalStudents = allStudents?.length ?? 0
  const totalClasses = classes?.length ?? 0
  const avgXp = totalStudents > 0
    ? Math.round((allStudents ?? []).reduce((s, u) => s + u.xp, 0) / totalStudents)
    : 0

  return (
    <>
      <div id="tour-teacher-stats" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Kelas Saya',   value: totalClasses,             icon: BookMarked,     color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', gradient: 'from-indigo-500/5 to-transparent' },
          { label: 'Total Siswa',        value: totalStudents,            icon: Users,          color: 'text-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-100', gradient: 'from-cyan-500/5 to-transparent'   },
          { label: 'Rata-rata XP', value: avgXp.toLocaleString(),   icon: BarChart3,      color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100', gradient: 'from-amber-500/5 to-transparent'  },
        ].map(({ label, value, icon: Icon, color, bg, border, gradient }) => (
          <div key={label} className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className={`mt-2 text-4xl font-black tabular-nums ${color} drop-shadow-sm`}>{value}</p>
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section id="tour-teacher-classes" className="mb-5">
        <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">📚 Kelas Saya</h2>
        {(classes ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-600">Belum ada kelas. Buat kelas pertama Anda untuk memulai.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(classes ?? []).map((cls) => {
              const students = cls.class_students || []
              const studentCount = students.length
              let classAvgXp = avgXp
              if (studentCount > 0) {
                const totalClassXp = students.reduce((acc: number, curr: any) => {
                  const xp = Array.isArray(curr.student) ? curr.student[0]?.xp : curr.student?.xp
                  return acc + (xp || 0)
                }, 0)
                classAvgXp = Math.round(totalClassXp / studentCount)
              }
              const moduleCount = Array.isArray(cls.modules) ? cls.modules.length : 0;
              return (
                <ClassCard key={cls.id} id={cls.id} name={cls.name} description={cls.description} joinCode={cls.join_code} flashcards={cls.flashcards} studentCount={studentCount} moduleCount={moduleCount} avgXp={classAvgXp} gamificationMode={cls.gamification_mode} />
              )
            })}
          </div>
        )}
      </section>

      <div id="tour-teacher-progress" className="mt-5">
        <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">📈 Peringkat & Progres Siswa Keseluruhan (Top 50)</h2>
        <StudentProgressTable students={allStudents} />
      </div>
    </>
  )
}
