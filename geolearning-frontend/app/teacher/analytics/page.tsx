import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BarChart3 } from 'lucide-react'
import type { Metadata } from 'next'
import { ClassAnalyticsClient } from '../../../components/teacher/ClassAnalyticsClient'

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
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Analitik & Asesmen
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau statistik dan perkembangan performa siswa secara detail.
        </p>
      </div>

      <ClassAnalyticsClient classes={classes ?? []} />
    </div>
  )
}
