import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle } from 'lucide-react'
import { InteractiveBackground } from '@/components/ui/InteractiveBackground'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { dashboardTeacherSteps } from '@/lib/utils/tourSteps'
import { Suspense } from 'react'
import { TeacherDashboardStats } from './TeacherDashboardStats'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GeoLearning — Teacher Dashboard',
  description: 'Manage your classes and monitor student progress',
}

export const dynamic = 'force-dynamic'

function StatsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-slate-200" />
        <div className="h-28 rounded-2xl bg-slate-200" />
        <div className="h-28 rounded-2xl bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-44 rounded-2xl bg-slate-200" />
        <div className="h-44 rounded-2xl bg-slate-200" />
        <div className="h-44 rounded-2xl bg-slate-200" />
      </div>
      <div className="h-64 rounded-3xl bg-slate-200" />
    </div>
  )
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

  return (
    <div className="relative min-h-full p-5 lg:p-7 overflow-hidden bg-slate-50/50">
      <OnboardingTour tourKey="dashboard_teacher" steps={dashboardTeacherSteps} />
      <InteractiveBackground />
      <div className="relative z-10">
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

      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
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

      <Suspense fallback={<StatsSkeleton />}>
        <TeacherDashboardStats user={user} profile={profile} />
      </Suspense>

      </div>
    </div>
  )
}
