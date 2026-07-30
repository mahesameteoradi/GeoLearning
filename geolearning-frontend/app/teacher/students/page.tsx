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
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <Users className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Manajemen Siswa
              </h1>
              <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">
                Pantau perkembangan, rekam jejak, dan tingkatkan keterlibatan seluruh siswa Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Siswa', value: students.length, color: 'text-cyan-600', border: 'border-cyan-100', bg: 'bg-cyan-50', gradient: 'from-cyan-500/5 to-transparent' },
          { label: 'Rata-rata XP', value: avgXp.toLocaleString(), color: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50', gradient: 'from-amber-500/5 to-transparent' },
          { label: 'Rata-rata Level', value: `Lv. ${avgLevel}`, color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50', gradient: 'from-blue-500/5 to-transparent' },
          { label: 'Streak Aktif', value: activeStreaks, color: 'text-orange-600', border: 'border-orange-100', bg: 'bg-orange-50', gradient: 'from-orange-500/5 to-transparent' },
        ].map(({ label, value, color, border, bg, gradient }) => (
          <div key={label} className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className={`mt-2 text-3xl font-black tabular-nums ${color} drop-shadow-sm`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <StudentSearchTable students={students} />
    </div>
  )
}
