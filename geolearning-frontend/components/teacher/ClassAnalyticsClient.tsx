'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { calculateLevel } from '@/lib/utils/level'

interface ClassData {
  id: string
  name: string
}

// ─── Custom Animated Bar Tooltip ──────────────────────────────────────────────
function TopicTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const val = Number(payload[0]?.value || 0)
  const color = val >= 85 ? '#10b981' : val >= 70 ? '#3b82f6' : val >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{val.toFixed(1)}%</p>
      <p className="text-[10px] text-slate-400 mt-0.5">
        {val >= 85 ? '🟢 Sangat Baik' : val >= 70 ? '🔵 Baik' : val >= 50 ? '🟡 Cukup' : '🔴 Perlu Perhatian'}
      </p>
    </div>
  )
}

// ─── Custom Bar with gradient fill ───────────────────────────────────────────
function getBarColor(score: number) {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

// ─── Topic Performance Chart ──────────────────────────────────────────────────
function TopicPerformanceChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
        <BarChart3 className="h-10 w-10 opacity-20" />
        <p className="text-sm">Belum ada data performa kuis.</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    topic: d.topic.length > 16 ? d.topic.slice(0, 16) + '…' : d.topic,
    fullTopic: d.topic,
    skor: d.rata_rata_skor,
    fill: getBarColor(d.rata_rata_skor),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
        barCategoryGap="28%"
      >
        <defs>
          {chartData.map((d, i) => (
            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={d.fill} stopOpacity={0.85} />
              <stop offset="100%" stopColor={d.fill} stopOpacity={1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="topic"
          width={110}
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<TopicTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)', rx: 8 }} />
        <Bar dataKey="skor" radius={[0, 8, 8, 0]} maxBarSize={22}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={`url(#grad-${i})`} />
          ))}
          <LabelList
            dataKey="skor"
            position="right"
            formatter={(v: any) => `${Number(v).toFixed(0)}%`}
            style={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────
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
        const headers = { Authorization: `Bearer ${token}` }

        const [sumRes, topRes, stuRes] = await Promise.all([
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/summary`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/topic-performance`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/students`, { headers }),
        ])

        if (isMounted) {
          if (sumRes.ok) setSummary(await sumRes.json())
          if (topRes.ok) { const d = await topRes.json(); if (Array.isArray(d)) setTopicPerformance(d) }
          if (stuRes.ok) { const d = await stuRes.json(); if (Array.isArray(d)) setStudents(d) }
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

  const summaryItems = summary ? [
    {
      label: 'Rata-rata Skor',
      value: `${Number(summary.rata_rata_skor).toFixed(1)}%`,
      color: 'text-indigo-600',
      border: 'border-indigo-100',
      bg: 'bg-indigo-50',
      barColor: '#6366f1',
      pct: Number(summary.rata_rata_skor),
    },
    {
      label: 'Completion Rate',
      value: `${Number(summary.completion_rate).toFixed(1)}%`,
      color: 'text-emerald-600',
      border: 'border-emerald-100',
      bg: 'bg-emerald-50',
      barColor: '#10b981',
      pct: Number(summary.completion_rate),
    },
    {
      label: 'Siswa Aktif',
      value: summary.siswa_aktif,
      color: 'text-amber-600',
      border: 'border-amber-100',
      bg: 'bg-amber-50',
      barColor: '#f59e0b',
      pct: summary.siswa_aktif + summary.siswa_pasif > 0
        ? (summary.siswa_aktif / (summary.siswa_aktif + summary.siswa_pasif)) * 100 : 0,
    },
    {
      label: 'Siswa Pasif',
      value: summary.siswa_pasif,
      color: 'text-rose-600',
      border: 'border-rose-100',
      bg: 'bg-rose-50',
      barColor: '#ef4444',
      pct: summary.siswa_aktif + summary.siswa_pasif > 0
        ? (summary.siswa_pasif / (summary.siswa_aktif + summary.siswa_pasif)) * 100 : 0,
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="text-sm font-semibold text-slate-700">Pilih Kelas:</label>
        <select
          id="tour-teacher-analytics-select"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="block w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100" />)}
          </div>
          <div className="h-72 rounded-2xl bg-slate-100" />
          <div className="h-64 rounded-2xl bg-slate-100" />
        </div>
      ) : (
        <>
          {/* ── Summary KPI Cards with animated progress bar ── */}
          {summary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {summaryItems.map(({ label, value, color, border, bg, barColor, pct }) => (
                <div
                  key={label}
                  className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className={`mt-2 text-3xl font-black tabular-nums ${color}`}>{value}</p>
                  {/* animated micro progress bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}


            <div id="tour-teacher-analytics-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Panel */}
              <div className="lg:col-span-1 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800">Performa per Topik</h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Rata-rata Skor</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-5">Rata-rata skor kuis seluruh siswa per modul topik</p>

                {/* Color legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {[
                    { label: 'Sangat Baik ≥85%', color: '#10b981' },
                    { label: 'Baik ≥70%', color: '#3b82f6' },
                    { label: 'Cukup ≥50%', color: '#f59e0b' },
                    { label: 'Perlu Perhatian', color: '#ef4444' },
                  ].map(({ label, color }) => (
                    <span key={label} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                    </span>
                  ))}
                </div>

                <div style={{ height: Math.max(220, topicPerformance.length * 48 + 40) }}>
                  <TopicPerformanceChart data={topicPerformance} />
                </div>
              </div>

              {/* Student Table */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Daftar Siswa</h3>
                  <span className="text-xs text-slate-400">{students.length} siswa</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/60 text-slate-400 text-xs uppercase tracking-wider">
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
                    <tbody className="divide-y divide-slate-50">
                      {students.map((s) => (
                        <tr key={s.user_id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-sm overflow-hidden">
                                {s.avatar_url ? (
                                  <img src={s.avatar_url} alt={s.nama} className="h-full w-full object-cover" />
                                ) : (
                                  s.nama.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-medium text-slate-800">{s.nama}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center text-slate-500 font-semibold">{calculateLevel(s.xp || 0)}</td>
                          <td className="px-5 py-3 text-right font-bold text-amber-500">{s.xp.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, s.rata_rata_skor)}%`,
                                    backgroundColor: getBarColor(s.rata_rata_skor)
                                  }}
                                />
                              </div>
                              <span className="font-semibold text-slate-700">{s.rata_rata_skor.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center text-slate-500">{s.jumlah_kuis_selesai}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
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
                              className="inline-flex items-center justify-center rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                            >
                              Detail
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                            Belum ada siswa di kelas ini.
                          </td>
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
