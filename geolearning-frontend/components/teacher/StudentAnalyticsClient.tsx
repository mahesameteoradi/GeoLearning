'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Award, AlertCircle, CheckCircle, AlertTriangle, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
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
  
  const [interventionMsg, setInterventionMsg] = useState('')
  const [interventionType, setInterventionType] = useState('ACADEMIC')
  const [xpBonus, setXpBonus] = useState(50)
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false)
  
  const typeColors: Record<string, string> = {
    ACADEMIC:    'border-blue-300 bg-violet-50 text-blue-700',
    BEHAVIORAL:  'border-orange-200 bg-orange-50 text-orange-600',
    ATTENDANCE:  'border-cyan-200 bg-cyan-50 text-cyan-600',
    EMOTIONAL:   'border-pink-200 bg-pink-50 text-pink-600',
    POSITIVE:    'border-emerald-300 bg-emerald-50 text-emerald-700',
    CORRECTIVE:  'border-red-300 bg-red-50 text-red-700',
  }
  
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

  const handleAddIntervention = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!interventionMsg.trim()) return
    setIsSubmittingIntervention(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'
      
      if (interventionType === 'POSITIVE') {
        const res = await fetch(`${apiUrl}/gamification/boost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ studentId, xpBonus, note: interventionMsg })
        })
        if (res.ok) {
          const result = await res.json()
          setInterventions([result.intervention, ...interventions])
          setInterventionMsg('')
          setInterventionType('ACADEMIC')
          setXpBonus(50)
        }
      } else {
        const res = await fetch(`${apiUrl}/teacher/analytics/student/${studentId}/interventions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: interventionMsg, type: interventionType })
        })

        if (res.ok) {
          const newInv = await res.json()
          setInterventions([newInv, ...interventions])
          setInterventionMsg('')
          setInterventionType('ACADEMIC')
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmittingIntervention(false)
    }
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
        <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200/80 shadow-sm">
          {[
            { id: '7', label: '7 Hari Terakhir' },
            { id: '30', label: '30 Hari Terakhir' },
            { id: 'all', label: 'Semua Waktu' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id as any)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300 ${
                timeRange === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h3 className="mb-5 font-bold text-slate-800">Tren Skor Kuis</h3>
          <div className="h-64">
            {filteredScoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredScoreTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSkor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="skor" name="Skor" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSkor)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada data kuis dalam rentang waktu ini.
              </div>
            )}
          </div>
        </div>

        {/* XP Trend */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h3 className="mb-5 font-bold text-slate-800">Tren Pertumbuhan XP</h3>
          <div className="h-64">
            {filteredXpTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredXpTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Area type="stepAfter" dataKey="xp_kumulatif" name="XP Kumulatif" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
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
        {/* Competency Profile Radar */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200/80 bg-white p-6 flex flex-col shadow-lg shadow-slate-200/40">
          <h3 className="mb-5 font-bold text-slate-800">Profil Kompetensi Siswa</h3>
          <div className="flex-1 min-h-[250px]">
            {topicBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={topicBreakdown} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Siswa" dataKey="rata_rata_skor_siswa" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)} Poin`, 'Skor Siswa']}
                  />
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
          <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-lg shadow-slate-200/40">
            <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Pencapaian Badge</h3>
            </div>
            <div className="p-5">
              {badgeTimeline.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {badgeTimeline.map((b, i) => (
                    <div key={i} className="flex min-w-[120px] flex-col items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-center transition-all hover:bg-indigo-50 hover:shadow-md">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2">{b.badge_name}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">{format(new Date(b.earned_at), 'dd MMM yyyy', { locale: id })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-slate-500">Belum ada badge yang diraih.</div>
              )}
            </div>
          </div>

          {/* Form Intervensi */}
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 shadow-inner">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-inner">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Berikan Intervensi Penguatan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tuliskan pesan penyemangat atau teguran konstruktif.</p>
              </div>
            </div>
            
            <form onSubmit={handleAddIntervention} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-slate-500">
                  Tipe Intervensi
                </label>
                <select
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  disabled={isSubmittingIntervention}
                >
                  {(['ACADEMIC', 'BEHAVIORAL', 'ATTENDANCE', 'EMOTIONAL', 'POSITIVE', 'CORRECTIVE']).map((t) => (
                    <option key={t} value={t}>{t === 'POSITIVE' ? 'POSITIVE (Kirim Motivasi & XP)' : t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-slate-500">
                  Catatan / Pesan
                </label>
                <textarea
                  value={interventionMsg}
                  onChange={(e) => setInterventionMsg(e.target.value)}
                  placeholder="Contoh: Ayo pelajari lebih lanjut bab Peta Geografi!"
                  rows={2}
                  required
                  className="w-full resize-none rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  disabled={isSubmittingIntervention}
                />
              </div>

              {interventionType === 'POSITIVE' && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-emerald-600">
                    XP Bonus (Reward)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={xpBonus}
                    onChange={(e) => setXpBonus(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold"
                    disabled={isSubmittingIntervention}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!interventionMsg.trim() || isSubmittingIntervention}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/30 disabled:opacity-50"
              >
                {isSubmittingIntervention ? 'Menyimpan...' : 'Kirim Intervensi'}
              </button>
            </form>
          </div>

          {/* Interventions */}
          <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-lg shadow-slate-200/40">
            <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Riwayat Intervensi Guru</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {interventions.length > 0 ? (
                interventions.map((inv, i) => (
                  <li key={i} className={cn('flex items-start gap-4 p-6 transition-colors hover:bg-indigo-50/30 group', inv.status === 'completed' && 'opacity-60')}>
                    <span className={cn('mt-0.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-sm', typeColors[inv.type || 'ACADEMIC'] || typeColors['ACADEMIC'])}>
                      {inv.type || 'ACADEMIC'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{inv.message || inv.note}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <span>{format(new Date(inv.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                      </div>
                    </div>
                    {inv.status === 'completed' && <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600 drop-shadow-sm" />}
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
