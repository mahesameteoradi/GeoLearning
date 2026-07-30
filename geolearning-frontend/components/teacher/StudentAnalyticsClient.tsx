'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import { Award, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function StudentAnalyticsClient({ studentId }: { studentId: string }) {
  const [scoreTrend, setScoreTrend] = useState<any[]>([])
  const [xpTrend, setXpTrend] = useState<any[]>([])
  const [badgeTimeline, setBadgeTimeline] = useState<any[]>([])
  const [topicBreakdown, setTopicBreakdown] = useState<any[]>([])
  const [interventions, setInterventions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('all')

  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'
        const headers = { Authorization: `Bearer ${token}` }

        const [stRes, xpRes, btRes, tbRes, inRes] = await Promise.all([
          fetch(`${apiUrl}/teacher/analytics/student/${studentId}/score-trend`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/student/${studentId}/xp-trend`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/student/${studentId}/badge-timeline`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/student/${studentId}/topic-breakdown`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/student/${studentId}/interventions`, { headers })
        ])

        if (isMounted) {
          if (stRes.ok) setScoreTrend(await stRes.json())
          if (xpRes.ok) setXpTrend(await xpRes.json())
          if (btRes.ok) setBadgeTimeline(await btRes.json())
          if (tbRes.ok) setTopicBreakdown(await tbRes.json())
          if (inRes.ok) setInterventions(await inRes.json())
        }
      } catch (error) {
        console.error('Error fetching student analytics:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [studentId, supabase.auth])

  const filterByDate = (data: any[], dateField: string) => {
    if (timeRange === 'all') return data
    const now = new Date()
    const days = parseInt(timeRange)
    const limitDate = new Date(now.setDate(now.getDate() - days))
    return data.filter(d => new Date(d[dateField]) >= limitDate)
  }

  const filteredScoreTrend = filterByDate(scoreTrend, 'tanggal').map(d => ({
    ...d,
    formattedDate: format(new Date(d.tanggal), 'dd MMM', { locale: id })
  }))

  const filteredXpTrend = filterByDate(xpTrend, 'tanggal').map(d => ({
    ...d,
    formattedDate: format(new Date(d.tanggal), 'dd MMM', { locale: id })
  }))

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl bg-slate-200" />
          <div className="h-72 rounded-2xl bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {[
            { id: '7', label: '7 Hari Terakhir' },
            { id: '30', label: '30 Hari Terakhir' },
            { id: 'all', label: 'Semua Waktu' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id as any)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                timeRange === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-bold text-slate-800">Tren Skor Kuis</h3>
          <div className="h-64">
            {filteredScoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredScoreTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="skor" name="Skor" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada data kuis dalam rentang waktu ini.
              </div>
            )}
          </div>
        </div>

        {/* XP Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-bold text-slate-800">Tren Pertumbuhan XP</h3>
          <div className="h-64">
            {filteredXpTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredXpTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="xp_kumulatif" name="XP Kumulatif" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada riwayat XP tercatat dalam rentang waktu ini.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Breakdown Radar */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
          <h3 className="mb-4 font-bold text-slate-800">Analisis Topik vs Kelas</h3>
          <div className="flex-1 min-h-[250px]">
            {topicBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={topicBreakdown}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Siswa" dataKey="rata_rata_skor_siswa" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  <Radar name="Rata-rata Kelas" dataKey="rata_rata_skor_kelas" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Data topik belum tersedia.
              </div>
            )}
          </div>
        </div>

        {/* Timeline Badge & Interventions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badge Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Pencapaian Badge</h3>
            </div>
            <div className="p-5">
              {badgeTimeline.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {badgeTimeline.map((b, i) => (
                    <div key={i} className="flex min-w-[120px] flex-col items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Award className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-2">{b.badge_name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">{format(new Date(b.earned_at), 'dd MMM yyyy', { locale: id })}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-slate-500">Belum ada badge yang diraih.</div>
              )}
            </div>
          </div>

          {/* Interventions */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Riwayat Intervensi Guru</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {interventions.length > 0 ? (
                interventions.map((inv, i) => (
                  <li key={i} className="flex items-start gap-3 p-4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${inv.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {inv.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{inv.message}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{format(new Date(inv.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                        <span>•</span>
                        <span className={`font-bold uppercase ${inv.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'}`}>{inv.status}</span>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-6 text-center text-sm text-slate-500">Belum ada catatan intervensi.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
