import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, User as UserIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { StudentAnalyticsClient } from '../../../../../components/teacher/StudentAnalyticsClient'

export const metadata: Metadata = {
  title: 'GeoLearning — Detail Siswa',
  description: 'Analitik detail performa siswa',
}

export default async function StudentDetailAnalyticsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('users')
    .select('id, name, level, xp')
    .eq('id', params.id)
    .single()

  if (!student) {
    return <div className="p-8 text-center">Siswa tidak ditemukan.</div>
  }

  return (
    <div className="min-h-full p-5 lg:p-7">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/teacher/analytics" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <UserIcon className="h-6 w-6 text-blue-600" />
            {student.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Detail perkembangan skor dan performa belajar.
          </p>
        </div>
      </div>

      <StudentAnalyticsClient studentId={student.id} />
    </div>
  )
}
