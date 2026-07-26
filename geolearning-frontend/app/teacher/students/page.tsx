import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { StudentSearchTable } from '@/components/teacher/StudentSearchTable'
import { calculateLevel } from '@/lib/utils/level'

export const metadata: Metadata = {
  title: 'GeoLearning — Students',
  description: 'Pantau progres seluruh siswa',
}

export default async function TeacherStudentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawStudents } = await supabase
    .from('users')
    .select('id, name, email, xp, level, current_streak, longest_streak, avatar_url')
    .eq('role', 'STUDENT')
    .order('xp', { ascending: false })
    .limit(200)

  // Fetch enrollments to know which class each student is in (for teacher's classes)
  const { data: teacherClasses } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)

  const teacherClassIds = (teacherClasses ?? []).map((c) => c.id)

  // Fetch enrollments for teacher's classes
  const { data: enrollments } = teacherClassIds.length > 0
    ? await supabase
        .from('class_students')
        .select('student_id, class_id')
        .in('class_id', teacherClassIds)
    : { data: [] }

  // Build a map: student_id → class names they're enrolled in (teacher's classes)
  const studentClassMap: Record<string, string[]> = {}
  for (const enroll of enrollments ?? []) {
    const cls = (teacherClasses ?? []).find((c) => c.id === enroll.class_id)
    if (cls) {
      studentClassMap[enroll.student_id] = [
        ...(studentClassMap[enroll.student_id] ?? []),
        cls.name,
      ]
    }
  }

  const students = (rawStudents ?? []).map((s) => ({
    ...s,
    level: calculateLevel(s.xp),
    enrolledClasses: studentClassMap[s.id] ?? [],
  }))

  const avgXp = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.xp, 0) / students.length)
    : 0

  const avgLevel = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.level, 0) / students.length)
    : 0

  const activeStreaks = students.filter((s) => s.current_streak > 0).length

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Users className="h-5 w-5 text-cyan-600" />
          Students
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Pantau perkembangan dan progres seluruh siswa
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Siswa', value: students.length, color: 'text-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50' },
          { label: 'Rata-rata XP', value: avgXp.toLocaleString(), color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
          { label: 'Rata-rata Level', value: `Lv. ${avgLevel}`, color: 'text-blue-600', border: 'border-blue-300', bg: 'bg-blue-50' },
          { label: 'Streak Aktif', value: activeStreaks, color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50' },
        ].map(({ label, value, color, border, bg }) => (
          <div key={label} className={`rounded-2xl border ${border} ${bg} p-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
            <p className={`mt-1.5 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <StudentSearchTable students={students} />
    </div>
  )
}
