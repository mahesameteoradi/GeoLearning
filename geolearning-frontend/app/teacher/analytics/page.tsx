import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BarChart3 } from 'lucide-react'
import type { Metadata } from 'next'
import { ClassAnalyticsClient } from '../../../components/teacher/ClassAnalyticsClient'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { analyticsTeacherSteps } from '@/lib/utils/tourSteps'

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

  // Fetch teacher's classes for the selector
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)
    .order('name', { ascending: true })

  return (
    <div className="min-h-full p-5 lg:p-7">
      <OnboardingTour tourKey="analytics_teacher" steps={analyticsTeacherSteps} />
      {/* Header */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-slate-800 px-8 py-10 shadow-lg shadow-slate-800/10 border border-slate-800">
        {/* Subtle, non-intrusive background accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Analitik & Asesmen
              </h1>
              <p className="mt-2 text-slate-300 max-w-xl text-sm leading-relaxed font-medium">
                Pantau statistik, laporan kuis, dan tingkat pemahaman siswa secara komprehensif.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ClassAnalyticsClient classes={classes ?? []} />
    </div>
  )
}
