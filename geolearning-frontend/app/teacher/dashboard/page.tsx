import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClassCard } from '@/components/teacher/ClassCard'
import { StudentProgressTable } from '@/components/teacher/StudentProgressTable'
import { InterventionPanel } from '@/components/teacher/InterventionPanel'
import { BarChart3, BookMarked, Users, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GeoLearning — Teacher Dashboard',
  description: 'Manage your classes and monitor student progress',
}

export default async function TeacherDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, role, avatar_url, verification_status')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch teacher's classes with module and student counts
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id, name, description, join_code,
      modules(id),
      class_students(
        student:users!class_students_student_id_fkey(id, name, email, xp, current_streak, avatar_url)
      )
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  // Derive unique students from the teacher's classes
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

  // Fetch interventions by this teacher
  const { data: rawInterventions } = await supabase
    .from('interventions')
    .select(`
      id, note, type, resolved, created_at,
      student:users!interventions_student_id_fkey(id, name)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const interventions = (rawInterventions ?? []).map((iv) => {
    const stu = Array.isArray(iv.student) ? iv.student[0] : iv.student as { id: string; name: string } | null
    return {
      ...iv,
      student_id: stu?.id ?? '',
      studentName: stu?.name ?? 'Unknown',
    }
  })

  // Compute stats
  const totalStudents = allStudents?.length ?? 0
  const totalClasses = classes?.length ?? 0
  const avgXp = totalStudents > 0
    ? Math.round((allStudents ?? []).reduce((s, u) => s + u.xp, 0) / totalStudents)
    : 0
  const openInterventions = interventions.filter((i) => !i.resolved).length

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* ─── Verification Warning ──────────────────────────── */}
      {profile.verification_status === 'UNVERIFIED' && (
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800">Akun Belum Diverifikasi</h3>
            <p className="mt-1 text-sm text-amber-700">
              Akun Anda saat ini sedang menunggu verifikasi dari Admin. Anda dapat membuat kelas dan kuis (draft), 
              tetapi fitur publikasi dibatasi sampai akun Anda diverifikasi.
            </p>
          </div>
        </div>
      )}
      {profile.verification_status === 'SUSPENDED' && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-5 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800">Akun Ditangguhkan</h3>
            <p className="mt-1 text-sm text-red-700">
              Akun Anda telah ditangguhkan oleh Admin. Anda tidak dapat melakukan aktivitas pengajaran saat ini.
              Silakan hubungi Admin sekolah Anda.
            </p>
          </div>
        </div>
      )}

      {/* ─── Page Header ─────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-slate-800 text-xl text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard Guru</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Selamat datang, <span className="font-semibold text-slate-700">{profile.name}</span>. Berikut ringkasan kelas Anda.
          </p>
        </div>
      </div>

      {/* ─── Overview Stats ───────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Kelas Saya',   value: totalClasses,             icon: BookMarked,     color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
          { label: 'Siswa',        value: totalStudents,            icon: Users,          color: 'text-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-200'   },
          { label: 'Rata-rata XP', value: avgXp.toLocaleString(),   icon: BarChart3,      color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
          { label: 'Isu Terbuka',  value: openInterventions,        icon: AlertTriangle,  color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-2xl border ${border} bg-white p-4`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                <p className={`mt-1.5 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Classes Grid ─────────────────────────────────── */}
      <section className="mb-5">
        <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
          📚 Kelas Saya
        </h2>
        {(classes ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-600">
            Belum ada kelas. Buat kelas pertama Anda untuk memulai.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(classes ?? []).map((cls) => {
              const students = cls.class_students || []
              const studentCount = students.length
              
              let classAvgXp = avgXp // fallback to global avg if no students
              if (studentCount > 0) {
                const totalClassXp = students.reduce((acc: number, curr: any) => {
                  const xp = Array.isArray(curr.student) ? curr.student[0]?.xp : curr.student?.xp
                  return acc + (xp || 0)
                }, 0)
                classAvgXp = Math.round(totalClassXp / studentCount)
              }

              return (
                <ClassCard
                  key={cls.id}
                  id={cls.id}
                  name={cls.name}
                  description={cls.description}
                  joinCode={cls.join_code}
                  studentCount={studentCount}
                  moduleCount={(cls.modules as { id: string }[]).length}
                  avgXp={classAvgXp}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* ─── Bottom Grid ─────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Student Progress Table */}
        <div className="xl:col-span-2">
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
            📊 Progres Siswa
          </h2>
          <StudentProgressTable students={allStudents ?? []} />
        </div>

        {/* Interventions */}
        <div>
          <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
            ⚠️ Intervensi
          </h2>
          <InterventionPanel
            interventions={interventions}
            students={(allStudents ?? []).map((s) => ({ id: s.id, name: s.name }))}
            teacherId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
