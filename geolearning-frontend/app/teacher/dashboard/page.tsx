import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClassCard } from '@/components/teacher/ClassCard'
import { StudentProgressTable } from '@/components/teacher/StudentProgressTable'
import { BarChart3, BookMarked, Users, AlertTriangle } from 'lucide-react'
import { InteractiveBackground } from '@/components/ui/InteractiveBackground'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { dashboardTeacherSteps } from '@/lib/utils/tourSteps'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GeoLearning — Teacher Dashboard',
  description: 'Manage your classes and monitor student progress',
}

export const dynamic = 'force-dynamic'

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
      id, name, description, join_code, flashcards, gamification_mode,
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

  // Compute stats
  const totalStudents = allStudents?.length ?? 0
  const totalClasses = classes?.length ?? 0
  const avgXp = totalStudents > 0
    ? Math.round((allStudents ?? []).reduce((s, u) => s + u.xp, 0) / totalStudents)
    : 0

  return (
    <div className="relative min-h-full p-5 lg:p-7 overflow-hidden bg-slate-50/50">
      <OnboardingTour tourKey="dashboard_teacher" steps={dashboardTeacherSteps} />
      <InteractiveBackground />
      <div className="relative z-10">
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
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        {/* Decorative background elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 font-bold text-white text-3xl">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Dashboard Guru</h1>
            <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">
              Selamat datang kembali, <span className="font-semibold text-white">{profile.name}</span>. Pantau aktivitas kelas, evaluasi hasil belajar, dan lihat perkembangan siswa Anda.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Overview Stats ───────────────────────────────── */}
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

      {/* ─── Classes Grid ─────────────────────────────────── */}
      <section id="tour-teacher-classes" className="mb-5">
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
                  flashcards={cls.flashcards}
                  studentCount={studentCount}
                  moduleCount={(cls.modules as { id: string }[]).length}
                  avgXp={classAvgXp}
                  gamificationMode={cls.gamification_mode}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* ─── Bottom Grid ─────────────────────────────────── */}
      <div id="tour-teacher-progress" className="mt-5">
        <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
          📊 Progres Siswa
        </h2>
        <StudentProgressTable students={allStudents ?? []} />
      </div>
      </div>
    </div>
  )
}
