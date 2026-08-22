'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle, Sparkles, Download, Loader2, BrainCircuit } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { calculateLevel } from '@/lib/utils/level'
import toast from 'react-hot-toast'
import { LogoLoader } from '@/components/ui/LogoLoader'

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
    <div className="rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-md backdrop-blur-md">
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
        
        // Fetch VARK learning styles
        const { data: varkData } = await supabase
          .from('class_students')
          .select('student_id, student:users!student_id(learning_style)')
          .eq('class_id', selectedClassId)

        if (isMounted) {
          if (sumRes.ok) setSummary(await sumRes.json())
          if (topRes.ok) { const d = await topRes.json(); if (Array.isArray(d)) setTopicPerformance(d) }
          if (stuRes.ok) { 
            const d = await stuRes.json()
            if (Array.isArray(d)) {
              // Merge VARK data into students
              const merged = d.map((s: any) => {
                const styleObj = varkData?.find(v => v.student_id === s.user_id)
                const style = (styleObj?.student as any)?.learning_style || null
                return { ...s, learning_style: style }
              })
              setStudents(merged)
            } 
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

  const [isExporting, setIsExporting] = useState(false)

  const handleExportFinalGrades = async () => {
    if (students.length === 0) {
      toast.error('Belum ada siswa di kelas ini.')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Mengambil data nilai realtime...')
    try {
      const supabase = createClient()
      
      // Ambil detail siswa (NIS dan No. Absen) dari class_students
      const { data: classStudentsData } = await supabase
        .from('class_students')
        .select(`
          no_absen,
          student:users!student_id(id, name, nis_nip)
        `)
        .eq('class_id', selectedClassId)
      
      const studentDetailsMap = new Map()
      classStudentsData?.forEach(cs => {
        studentDetailsMap.set((cs.student as any).id, {
          no_absen: cs.no_absen,
          nis_nip: (cs.student as any).nis_nip
        })
      })

      // 1. Ambil data tugas proyek dan nilainya
      const { data: projects } = await supabase
        .from('project_assignments')
        .select('id, title, is_group_project')
        .eq('class_id', selectedClassId)
        .order('created_at', { ascending: true })

      const projectIds = projects?.map(p => p.id) || []
      let projectSubmissions: any[] = []
      if (projectIds.length > 0) {
        const { data: pSubs } = await supabase
          .from('project_submissions')
          .select('user_id, assignment_id, score, group_members')
          .in('assignment_id', projectIds)
        projectSubmissions = pSubs || []
      }

      // 2. Ambil data kuis dan nilainya
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('class_id', selectedClassId)
      
      const moduleIds = modules?.map(m => m.id) || []
      let quizzes: any[] = []
      let quizSubmissions: any[] = []
      
      if (moduleIds.length > 0) {
        const { data: qz } = await supabase
          .from('quizzes')
          .select('id, title, is_published')
          .in('module_id', moduleIds)
          .eq('is_published', true)
          .order('created_at', { ascending: true })
        quizzes = qz || []
      }
      
      const quizIds = quizzes.map(q => q.id)
      if (quizIds.length > 0) {
        const { data: qSubs } = await supabase
          .from('quiz_attempts')
          .select('user_id, quiz_id, score')
          .in('quiz_id', quizIds)
        quizSubmissions = qSubs || []
      }

      // 3. Susun data CSV
      const headers = [
        'No. Absen',
        'Nama Siswa',
        'NIS',
        ...(projects || []).map((p, i) => `Tugas ${i + 1}: ${p.title}`),
        ...quizzes.map((q, i) => `Kuis ${i + 1}: ${q.title}`),
        'Rata-rata Tugas',
        'Rata-rata Kuis',
        'NILAI AKHIR'
      ]

      const rows = [headers]

      const getProjectScore = (studentId: string, projectId: string, isGroup: boolean) => {
        if (!isGroup) {
          const sub = projectSubmissions.find(s => s.assignment_id === projectId && s.user_id === studentId)
          return sub?.score ?? null
        }
        const sub = projectSubmissions.find(s => {
          if (s.assignment_id !== projectId) return false
          if (s.user_id === studentId) return true
          if (s.group_members) {
            try {
              const members = typeof s.group_members === 'string' ? JSON.parse(s.group_members) : s.group_members
              if (Array.isArray(members) && members.includes(studentId)) return true
              if (members.members && Array.isArray(members.members) && members.members.includes(studentId)) return true
            } catch (e) {}
          }
          return false
        })
        return sub?.score ?? null
      }

      const getQuizScore = (studentId: string, quizId: string) => {
        const subs = quizSubmissions.filter(s => s.quiz_id === quizId && s.user_id === studentId)
        if (subs.length === 0) return null
        return Math.max(...subs.map(s => s.score || 0))
      }

      const studentRows: any[][] = []
      
      // Sort students based on the API response (or map to real names)
      students.forEach(s => {
        const detail = studentDetailsMap.get(s.user_id) || {}
        
        let totalProjectScore = 0
        let projectCount = 0
        const projectScores = (projects || []).map(p => {
          const score = getProjectScore(s.user_id, p.id, p.is_group_project)
          if (score !== null) {
            totalProjectScore += score
            projectCount++
          }
          return score !== null ? score : 0
        })
        const avgProject = projectCount > 0 ? (totalProjectScore / (projects || []).length) : 0

        let totalQuizScore = 0
        let quizCount = 0
        const quizScores = quizzes.map(q => {
          const score = getQuizScore(s.user_id, q.id)
          if (score !== null) {
            totalQuizScore += score
            quizCount++
          }
          return score !== null ? score : 0
        })
        const avgQuiz = quizzes.length > 0 ? (totalQuizScore / quizzes.length) : 0

        let finalScore = 0
        if ((projects || []).length > 0 && quizzes.length > 0) {
          finalScore = (avgProject + avgQuiz) / 2
        } else if ((projects || []).length > 0) {
          finalScore = avgProject
        } else if (quizzes.length > 0) {
          finalScore = avgQuiz
        }

        const rowData = [
          detail.no_absen ?? 9999, // For sorting
          detail.no_absen?.toString() ?? '-',
          s.nama,
          detail.nis_nip ?? '-',
          ...projectScores,
          ...quizScores,
          avgProject.toFixed(2),
          avgQuiz.toFixed(2),
          finalScore.toFixed(2)
        ]

        studentRows.push(rowData)
      })

      // Sort by No. Absen and add to rows
      studentRows.sort((a, b) => a[0] - b[0])
      studentRows.forEach(row => rows.push(row.slice(1)))

      const csv = rows.map(r => r.map(c => `"${c.toString().replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const className = classes.find(c => c.id === selectedClassId)?.name || 'Kelas'
      a.download = `Rekap_Nilai_${className.replace(/\s+/g, '_')}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Nilai akhir berhasil diekspor!', { id: toastId })
    } catch (error: any) {
      toast.error('Gagal mengekspor nilai: ' + error.message, { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

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
      color: 'text-blue-600',
      border: 'border-blue-100',
      bg: 'bg-blue-50',
      barColor: '#6366f1',
      pct: Number(summary.rata_rata_skor),
    },
    {
      label: 'Completion Rate',
      value: `${Number(summary.completion_rate).toFixed(1)}%`,
      color: 'text-green-600',
      border: 'border-green-100',
      bg: 'bg-green-50',
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
          className="block w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-50" />)}
          </div>
          <div className="h-72 rounded-2xl bg-slate-50" />
          <div className="h-64 rounded-2xl bg-slate-50" />
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
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    {label === 'Rata-rata Skor' && (
                      <div className="group/tooltip relative z-20 cursor-help">
                        <AlertCircle className="h-4 w-4 text-slate-300 hover:text-blue-500 transition-colors" />
                        <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white shadow-md group-hover/tooltip:block">
                          Rata-rata ini adalah hasil kalkulasi dari <b>seluruh nilai kuis dan tugas</b> yang telah dikerjakan oleh siswa di kelas ini.
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-3xl font-black tabular-nums ${color}`}>{value}</p>
                  {/* animated micro progress bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-50 overflow-hidden">
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
              {/* Left Column for Charts */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                {/* Chart Panel */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800">Performa per Topik</h3>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">Rata-rata Skor</span>
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

                {/* VARK Distribution Panel */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-blue-500" />
                      Gaya Belajar (VARK)
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(() => {
                      const varkCounts: Record<string, number> = {
                        'Visual': 0, 'Auditory': 0, 'Reading/Writing': 0, 'Kinesthetic': 0
                      }
                      let totalTested = 0
                      students.forEach(s => {
                        if (s.learning_style && varkCounts[s.learning_style] !== undefined) {
                          varkCounts[s.learning_style]++
                          totalTested++
                        }
                      })

                      const varkStyles = [
                        { key: 'Visual', color: 'bg-blue-500' },
                        { key: 'Auditory', color: 'bg-green-500' },
                        { key: 'Reading/Writing', color: 'bg-amber-500' },
                        { key: 'Kinesthetic', color: 'bg-rose-500' }
                      ]

                      if (totalTested === 0) {
                        return <p className="text-sm text-slate-500 italic text-center py-4">Belum ada siswa yang mengikuti tes gaya belajar.</p>
                      }

                      return varkStyles.map(style => {
                        const count = varkCounts[style.key]
                        const pct = Math.round((count / totalTested) * 100) || 0
                        return (
                          <div key={style.key} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                              <span>{style.key} <span className="text-slate-400 font-normal">({count} siswa)</span></span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden">
                              <div className={`${style.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>

              {/* Student Table */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    Daftar Siswa
                    <span className="text-xs font-normal text-slate-400 bg-slate-200/50 px-2 rounded-full">{students.length} siswa</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="group relative flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-slate-400 cursor-help" />
                      <div className="absolute right-0 top-6 hidden w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-md group-hover:block z-50 text-xs text-slate-600">
                        <strong className="block text-slate-800 mb-1">Informasi Ekspor Nilai:</strong>
                        Nilai yang diekspor adalah kalkulasi realtime dari:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                          <li>Rata-rata seluruh skor <strong className="text-blue-600">Kuis</strong></li>
                          <li>Rata-rata seluruh skor <strong className="text-green-600">Tugas Proyek</strong></li>
                        </ul>
                        <p className="mt-1.5 italic text-[10px] text-slate-400">Rincian per kuis & tugas tersedia di dalam file Excel/CSV.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleExportFinalGrades}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 transition-all hover:bg-green-100 disabled:opacity-50 shadow-sm"
                    >
                      {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      Ekspor Nilai
                    </button>
                  </div>
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
                        <tr key={s.user_id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-bold text-white shadow-sm overflow-hidden">
                                {s.avatar_url ? (
                                  <img src={s.avatar_url} alt={s.nama} className="h-full w-full object-cover" />
                                ) : (
                                  s.nama.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800">{s.nama}</span>
                                {s.learning_style && (
                                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <BrainCircuit className="w-3 h-3 text-blue-400" />
                                    {s.learning_style}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center text-slate-500 font-semibold">{calculateLevel(s.xp || 0)}</td>
                          <td className="px-5 py-3 text-right font-bold text-amber-500">{s.xp.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-50 overflow-hidden">
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
                              s.status === 'baik' ? 'bg-green-100 text-green-700' :
                              s.status === 'perlu dipantau' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {s.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={`/teacher/analytics/student/${s.user_id}`}
                              className="inline-flex items-center justify-center rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
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

            {/* Grouping by VARK */}
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <BrainCircuit className="w-5 h-5 text-blue-500" />
                Kelompok Siswa Berdasarkan Gaya Belajar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'Visual', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
                  { key: 'Auditory', color: 'bg-green-50 border-green-200', text: 'text-green-700' },
                  { key: 'Reading/Writing', color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
                  { key: 'Kinesthetic', color: 'bg-rose-50 border-rose-200', text: 'text-rose-700' }
                ].map(style => {
                  const groupedStudents = students.filter(s => s.learning_style === style.key)
                  return (
                    <div key={style.key} className={`rounded-2xl border ${style.color} p-4`}>
                      <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                        <span className={`font-bold ${style.text}`}>{style.key}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 ${style.text}`}>{groupedStudents.length}</span>
                      </div>
                      {groupedStudents.length > 0 ? (
                        <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {groupedStudents.map(s => (
                            <li key={s.user_id} className={`text-sm ${style.text} flex items-center gap-2 bg-white/40 px-2.5 py-1.5 rounded-lg`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                              <span className="truncate">{s.nama}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`text-xs ${style.text} opacity-60 italic text-center py-2`}>Belum ada siswa</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
        </>
      )}
      <LogoLoader isOpen={isExporting} message="Mengekspor Data Nilai..." onCancel={() => setIsExporting(false)} />
    </div>
  )
}
