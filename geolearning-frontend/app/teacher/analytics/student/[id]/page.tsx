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

export default async function StudentDetailAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/v1').replace('localhost', '127.0.0.1')
  
  let student = null
  let errorMessage = ''
  
  try {
    const res = await fetch(`${apiUrl}/teacher/analytics/student/${resolvedParams.id}/profile`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store'
    })

    if (res.ok) {
      student = await res.json()
    } else {
      errorMessage = `API Error: ${res.status} ${res.statusText} - ${await res.text()}`
      console.error(errorMessage)
    }
  } catch (error: any) {
    errorMessage = `Fetch Error: ${error.message}`
    console.error(errorMessage)
  }

  if (!student) {
    return (
      <div className="p-8 text-center flex flex-col gap-4">
        <h2 className="text-xl font-bold text-red-600">Siswa tidak ditemukan.</h2>
        <p className="text-sm text-slate-500">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="min-h-full p-5 lg:p-7">
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/teacher/analytics" className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-110 text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {student.avatar_url ? (
              <div className="h-16 w-16 flex-shrink-0 rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner drop-shadow-md overflow-hidden relative">
                <img src={student.avatar_url} alt={student.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm drop-shadow-md">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                {student.name}
              </h1>
              <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">
                Detail perkembangan skor dan performa belajar siswa.
              </p>
            </div>
          </div>
        </div>
      </div>

      <StudentAnalyticsClient studentId={resolvedParams.id} />
    </div>
  )
}
