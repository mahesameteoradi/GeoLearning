import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, User as UserIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { StudentAnalyticsClient } from '../../../../../components/teacher/StudentAnalyticsClient'
import { getLevelMeaning, calculateLevel } from '@/lib/utils/level'
import { Shield } from 'lucide-react'

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
      if (res.status === 401) {
        // This usually happens when the token was just refreshed by middleware,
        // but this Server Component still holds the old token from the request cookie.
        // We can safely redirect them to the dashboard, or force a re-login.
        redirect('/login');
      }
      console.error(errorMessage)
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error; // Allow Next.js redirect to bubble up
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
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#0B1120] p-8 shadow-md border border-slate-800">
        
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
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm flex items-center gap-3">
                {student.name}
              </h1>
              <p className="mt-1.5 text-blue-100/80 max-w-xl text-sm leading-relaxed mb-3">
                Detail perkembangan skor dan performa belajar siswa.
              </p>
              
              {/* Level Meaning / Pemaknaan Level */}
              {(() => {
                const dynamicLevel = calculateLevel(student.xp || 0)
                const meaning = getLevelMeaning(dynamicLevel)
                return (
                  <div className={`inline-flex items-start gap-2.5 rounded-xl border ${meaning.color} bg-white px-3 py-2.5 shadow-sm backdrop-blur-sm`}>
                    <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider">{meaning.title} (Level {dynamicLevel})</span>
                      <span className="text-xs font-medium opacity-90 max-w-sm mt-0.5">{meaning.description}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      <StudentAnalyticsClient studentId={resolvedParams.id} studentData={student} />
    </div>
  )
}
