import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BarChart3 } from 'lucide-react'
import type { Metadata } from 'next'
import { AnalyticsTabsClient } from '../../../components/teacher/AnalyticsTabsClient'

export const metadata: Metadata = {
  title: 'GeoLearning — Analytics',
  description: 'Analitik performa kelas dan siswa',
}

export default async function TeacherAnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch teacher's classes with module counts and enrollments
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, modules(id), enrollments:class_students(student_id)')
    .eq('teacher_id', user.id)

  const classIds = (classes ?? []).map((c) => c.id)

  // Fetch all students in teacher's classes
  const { data: students } = await supabase
    .from('users')
    .select('id, name, xp, level, current_streak, class_students!inner(class_id)')
    .eq('role', 'STUDENT')
    .in('class_students.class_id', classIds)

  // Deduplicate students
  const uniqueStudentsMap = new Map<string, any>()
  if (students) {
    for (const s of students) {
      if (!uniqueStudentsMap.has(s.id)) {
        uniqueStudentsMap.set(s.id, { ...s, class_ids: [s.class_students[0].class_id] })
      } else {
        uniqueStudentsMap.get(s.id).class_ids.push(s.class_students[0].class_id)
      }
    }
  }
  const uniqueStudents = Array.from(uniqueStudentsMap.values())
  const studentIds = uniqueStudents.map((s) => s.id)

  // Fetch quiz attempts for those students
  let quizAttempts: any[] = []
  if (studentIds.length > 0) {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('id, user_id, score, xp_earned, completed_at, quiz:quizzes(title)')
      .not('completed_at', 'is', null)
      .in('user_id', studentIds)
    quizAttempts = attempts ?? []
  }

  // Fetch project submissions for those students
  let projectSubmissions: any[] = []
  if (studentIds.length > 0) {
    const { data: submissions } = await supabase
      .from('project_submissions')
      .select('id, user_id, score, xp_earned, submitted_at, graded_at, assignment:project_assignments(title)')
      .in('user_id', studentIds)
    projectSubmissions = submissions ?? []
  }

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau statistik dan perkembangan performa siswa secara detail.
        </p>
      </div>

      <AnalyticsTabsClient
        classes={classes ?? []}
        students={uniqueStudents}
        quizAttempts={quizAttempts}
        projectSubmissions={projectSubmissions}
      />
    </div>
  )
}
