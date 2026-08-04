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

// ─── Animated Progress Ring ───────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="shrink-0">
      <circle cx={36} cy={36} r={r} fill="none" stroke="#f1f5f9" strokeWidth={7} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x={36} y={40} textAnchor="middle" fontSize={13} fontWeight={800} fill={color}>
        {Math.round(score)}%
      </text>
    </svg>
  )
}

// ─── Quiz Question Stats Panel ────────────────────────────────────────────────
function QuizQuestionCard({ quiz }: { quiz: any }) {
  const [expanded, setExpanded] = useState(false)

  if (!quiz.most_correct && !quiz.most_incorrect) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-sm text-slate-400">
        Belum ada jawaban tercatat untuk <span className="font-bold text-slate-500">{quiz.quiz_title}</span>
      </div>
    )
  }

  const truncate = (text: string, max = 120) =>
    text?.length > max ? text.slice(0, max) + '…' : text

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">{quiz.quiz_title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {quiz.total_questions} soal · {quiz.all_questions?.reduce((s: number, q: any) => s + q.total_attempts, 0) || 0} total jawaban
          </p>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          {expanded ? 'Sembunyikan' : 'Lihat Semua'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Best & Worst */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-x divide-slate-100">
        {/* Most Correct */}
        {quiz.most_correct && (
          <div className="p-4 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Paling Banyak Benar</span>
            </div>
            <div className="flex items-start gap-3">
              <ScoreRing score={quiz.most_correct.correct_rate} color="#10b981" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 leading-snug">{truncate(quiz.most_correct.question_text)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    ✓ {quiz.most_correct.correct_count} benar
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                    {quiz.most_correct.total_attempts} total
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Incorrect */}
        {quiz.most_incorrect && (
          <div className="p-4 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">Paling Banyak Salah</span>
            </div>
            <div className="flex items-start gap-3">
              <ScoreRing score={quiz.most_incorrect.correct_rate} color="#ef4444" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 leading-snug">{truncate(quiz.most_incorrect.question_text)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600">
                    ✗ {quiz.most_incorrect.incorrect_count} salah
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                    {quiz.most_incorrect.total_attempts} total
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded: All Questions */}
      {expanded && quiz.all_questions?.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="bg-slate-50 px-5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Semua Soal — Diurutkan dari Paling Banyak Benar</p>
          </div>
          <div className="divide-y divide-slate-50">
            {quiz.all_questions.map((q: any, idx: number) => (
              <div key={q.question_id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-300">#{idx + 1}</span>
                <p className="flex-1 text-sm text-slate-600 leading-snug">{truncate(q.question_text, 100)}</p>
                <div className="shrink-0 flex items-center gap-2">
                  {/* Mini progress bar */}
                  <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${q.correct_rate}%`,
                        backgroundColor: getBarColor(q.correct_rate)
                      }}
                    />
                  </div>
                  <span
                    className="w-10 text-right text-xs font-bold"
                    style={{ color: getBarColor(q.correct_rate) }}
                  >
                    {q.correct_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ClassAnalyticsClient({ classes }: { classes: ClassData[] }) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')
  const [summary, setSummary] = useState<any>(null)
  const [topicPerformance, setTopicPerformance] = useState<any[]>([])
  const [quizQuestionStats, setQuizQuestionStats] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'soal'>('chart')

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

        const [sumRes, topRes, stuRes, qqRes] = await Promise.all([
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/summary`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/topic-performance`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/students`, { headers }),
          fetch(`${apiUrl}/teacher/analytics/class/${selectedClassId}/quiz-question-stats`, { headers }),
        ])

        if (isMounted) {
          if (sumRes.ok) setSummary(await sumRes.json())
          if (topRes.ok) { const d = await topRes.json(); if (Array.isArray(d)) setTopicPerformance(d) }
          if (stuRes.ok) { const d = await stuRes.json(); if (Array.isArray(d)) setStudents(d) }
          if (qqRes.ok) { const d = await qqRes.json(); if (Array.isArray(d)) setQuizQuestionStats(d) }
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

          {/* ── Sub-Tabs: Chart / Soal ── */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {([
              { id: 'chart', label: 'Performa per Topik', icon: BarChart3 },
              { id: 'soal', label: 'Analisis Soal Kuis', icon: Sparkles },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSubTab(id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
                  activeSubTab === id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {activeSubTab === id && (
                  <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: Topic Performance Chart ── */}
          {activeSubTab === 'chart' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          )}

          {/* ── TAB: Quiz Question Stats ── */}
          {activeSubTab === 'soal' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-700">
                  Panel ini menampilkan <strong>soal yang paling banyak dijawab benar</strong> dan{' '}
                  <strong>paling banyak dijawab salah</strong> untuk setiap kuis di kelas ini.
                  Gunakan informasi ini untuk menentukan fokus remedial atau pengayaan.
                </p>
              </div>

              {quizQuestionStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-slate-400">
                  <BarChart3 className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Belum ada data jawaban kuis untuk kelas ini.</p>
                  <p className="text-xs text-slate-300">Data akan muncul setelah siswa mengerjakan kuis.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizQuestionStats.map((quiz) => (
                    <QuizQuestionCard key={quiz.quiz_id} quiz={quiz} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
