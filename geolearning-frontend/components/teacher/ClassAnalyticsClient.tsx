'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, BookOpen, BarChart3, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import Link from 'next/link'

interface ClassData {
  id: string
  name: string
}

export function ClassAnalyticsClient({ classes }: { classes: ClassData[] }) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')
  const [summary, setSummary] = useState<any>(null)
  const [topicPerformance, setTopicPerformance] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!selectedClassId) return

    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'

        const headers = {
          Authorization: `Bearer ${token}`
        }

        const [sumRes, topRes, stuRes] = await Promise.all([
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/summary`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/topic-performance`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/students`, { headers })
        ])

        if (isMounted) {
          if (sumRes.ok) {
            setSummary(await sumRes.json());
          } else {
            console.error('Failed to fetch summary:', await sumRes.text());
          }

          if (topRes.ok) {
            const data = await topRes.json();
            if (Array.isArray(data)) setTopicPerformance(data);
          } else {
            console.error('Failed to fetch topic performance:', await topRes.text());
          }

          if (stuRes.ok) {
            const data = await stuRes.json();
            if (Array.isArray(data)) setStudents(data);
          } else {
            console.error('Failed to fetch students:', await stuRes.text());
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [selectedClassId, supabase.auth])

  if (classes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Anda belum memiliki kelas.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="text-sm font-semibold text-slate-700">Pilih Kelas:</label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="block w-full max-w-sm rounded-xl border border-slate-300 px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}
          </div>
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Rata-rata Skor', value: `${Number(summary.rata_rata_skor).toFixed(1)}%`, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50', gradient: 'from-indigo-500/5 to-transparent' },
                { label: 'Completion Rate', value: `${Number(summary.completion_rate).toFixed(1)}%`, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50', gradient: 'from-emerald-500/5 to-transparent' },
                { label: 'Siswa Aktif', value: summary.siswa_aktif, color: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50', gradient: 'from-amber-500/5 to-transparent' },
                { label: 'Siswa Pasif', value: summary.siswa_pasif, color: 'text-rose-600', border: 'border-rose-100', bg: 'bg-rose-50', gradient: 'from-rose-500/5 to-transparent' },
              ].map(({ label, value, color, border, bg, gradient }) => (
                <div key={label} className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                  <div className="relative">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className={`mt-2 text-3xl font-black tabular-nums ${color} drop-shadow-sm`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Topic Performance Bar Chart */}
            <div className="lg:col-span-1 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40">
              <h3 className="mb-5 font-bold text-slate-800">Performa per Topik (Rata-rata Skor)</h3>
              <div className="h-64">
                {topicPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="topic" type="category" width={80} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="rata_rata_skor" name="Rata-rata Skor" radius={[0, 4, 4, 0]}>
                        {topicPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.rata_rata_skor < 70 ? '#ef4444' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Belum ada data pengerjaan kuis.</div>
                )}
              </div>
            </div>

            {/* Student List Table */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40 overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Daftar Siswa</h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Nama Siswa</th>
                      <th className="px-5 py-3 font-semibold text-center">Level</th>
                      <th className="px-5 py-3 font-semibold text-right">XP</th>
                      <th className="px-5 py-3 font-semibold text-right">Rata-rata Skor</th>
                      <th className="px-5 py-3 font-semibold text-center">Kuis Selesai</th>
                      <th className="px-5 py-3 font-semibold text-center">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.user_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800">{s.nama}</td>
                        <td className="px-5 py-3 text-center text-slate-600">{s.level}</td>
                        <td className="px-5 py-3 text-right font-bold text-amber-500">{s.xp}</td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">{s.rata_rata_skor.toFixed(1)}%</td>
                        <td className="px-5 py-3 text-center text-slate-600">{s.jumlah_kuis_selesai}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                            s.status === 'baik' ? 'bg-emerald-100 text-emerald-700' :
                            s.status === 'perlu dipantau' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link 
                            href={`/teacher/analytics/student/${s.user_id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">Belum ada siswa di kelas ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
