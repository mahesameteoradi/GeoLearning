'use client'

import { useState } from 'react'
import { Users, Trophy, BookOpen, BarChart3, AlertCircle, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react'
import { AnalyticsCharts } from '@/components/teacher/AnalyticsCharts'

interface ClassData {
  id: string
  name: string
  modules: any[]
  enrollments: any[]
}

interface StudentData {
  id: string
  name: string
  xp: number
  level: number
  current_streak: number
  class_ids: string[]
}

interface AnalyticsTabsClientProps {
  classes: ClassData[]
  students: StudentData[]
  quizAttempts: any[]
  projectSubmissions: any[]
}

export function AnalyticsTabsClient({ classes, students, quizAttempts, projectSubmissions }: AnalyticsTabsClientProps) {
  const [activeTab, setActiveTab] = useState<'overall' | 'class' | 'student'>('overall')

  // Calculate actual XP from history to ensure it's 100% synced with original data
  const syncedStudents = students.map(s => {
    const qXp = quizAttempts.filter(q => q.user_id === s.id).reduce((sum, q) => sum + (q.xp_earned || 0), 0)
    const pXp = projectSubmissions.filter(p => p.user_id === s.id).reduce((sum, p) => sum + (p.xp_earned || 0), 0)
    const actualXp = qXp + pXp
    
    // Recalculate level based on actual XP
    let level = 1
    let threshold = 100
    let tempXp = actualXp
    while (tempXp >= threshold) {
      level++
      tempXp -= threshold
      threshold = Math.floor(threshold * 1.5)
    }

    return { ...s, xp: actualXp, level }
  })

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'overall', label: 'Keseluruhan' },
          { id: 'class', label: 'Per Kelas' },
          { id: 'student', label: 'Per Siswa' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`relative px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === t.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
            {activeTab === t.id && (
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overall' && (
        <OverallTab classes={classes} students={syncedStudents} quizAttempts={quizAttempts} />
      )}
      {activeTab === 'class' && (
        <ClassTab classes={classes} students={syncedStudents} quizAttempts={quizAttempts} />
      )}
      {activeTab === 'student' && (
        <StudentTab students={syncedStudents} quizAttempts={quizAttempts} projectSubmissions={projectSubmissions} />
      )}
    </div>
  )
}

function OverallTab({ classes, students, quizAttempts }: any) {
  const levelBuckets: Record<string, number> = { 'Lv 1-5': 0, 'Lv 6-10': 0, 'Lv 11-20': 0, 'Lv 21-50': 0, 'Lv 51+': 0 }
  for (const s of students) {
    if (s.level <= 5) levelBuckets['Lv 1-5']++
    else if (s.level <= 10) levelBuckets['Lv 6-10']++
    else if (s.level <= 20) levelBuckets['Lv 11-20']++
    else if (s.level <= 50) levelBuckets['Lv 21-50']++
    else levelBuckets['Lv 51+']++
  }
  const levelDist = Object.entries(levelBuckets).map(([range, count]) => ({ range, count }))

  const classStats = classes.map((cls: any) => ({
    name: cls.name.length > 12 ? cls.name.slice(0, 12) + '…' : cls.name,
    modules: cls.modules.length,
    avgXp: 0,
  }))

  const sorted = [...students].sort((a, b) => a.xp - b.xp)
  const bucketSize = Math.max(1, Math.ceil(sorted.length / 20))
  const xpTrend = []
  for (let i = 0; i < sorted.length; i += bucketSize) {
    const slice = sorted.slice(i, i + bucketSize)
    const avgXp = Math.round(slice.reduce((s: number, x: any) => s + x.xp, 0) / slice.length)
    xpTrend.push({ label: `${i + 1}`, xp: avgXp })
  }

  const buckets = { 'Sempurna (90-100)': 0, 'Baik (70-89)': 0, 'Cukup (50-69)': 0, 'Perlu Latihan (<50)': 0 }
  for (const a of quizAttempts) {
    if (a.score >= 90) buckets['Sempurna (90-100)']++
    else if (a.score >= 70) buckets['Baik (70-89)']++
    else if (a.score >= 50) buckets['Cukup (50-69)']++
    else buckets['Perlu Latihan (<50)']++
  }
  const quizStats = Object.entries(buckets).map(([label, value]) => ({ label, value })).filter((b) => b.value > 0)

  const totalStudents = students.length
  const avgXp = totalStudents > 0 ? Math.round(students.reduce((s: number, u: any) => s + u.xp, 0) / totalStudents) : 0
  const activeStreaks = students.filter((s: any) => s.current_streak > 0).length
  const completedAttempts = quizAttempts.length
  const avgScore = completedAttempts > 0 ? Math.round(quizAttempts.reduce((s: number, a: any) => s + a.score, 0) / completedAttempts) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Siswa', value: totalStudents, icon: Users, color: 'text-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50' },
          { label: 'Rata-rata XP', value: avgXp.toLocaleString(), icon: Trophy, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
          { label: 'Quiz Selesai', value: completedAttempts, icon: BookOpen, color: 'text-blue-600', border: 'border-blue-300', bg: 'bg-blue-50' },
          { label: 'Rata-rata Score', value: `${avgScore}%`, icon: BarChart3, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, border, bg }) => (
          <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${color.replace('text-', '')}/10`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                <p className={`mt-1.5 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <AnalyticsCharts levelDist={levelDist} classStats={classStats} xpTrend={xpTrend} quizStats={quizStats} />
    </div>
  )
}

function ClassTab({ classes, students, quizAttempts }: any) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '')

  const classData = classes.find((c: any) => c.id === selectedClass)
  const classStudents = students.filter((s: any) => s.class_ids.includes(selectedClass))
  const studentIds = new Set(classStudents.map((s: any) => s.id))
  const classQuizzes = quizAttempts.filter((q: any) => studentIds.has(q.user_id))

  const avgXp = classStudents.length > 0 ? Math.round(classStudents.reduce((s: number, u: any) => s + u.xp, 0) / classStudents.length) : 0
  const avgScore = classQuizzes.length > 0 ? Math.round(classQuizzes.reduce((s: number, q: any) => s + q.score, 0) / classQuizzes.length) : 0

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-slate-700">Pilih Kelas</label>
        <select 
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
          className="mt-1 block w-full max-w-sm rounded-xl border border-slate-300 px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {classData && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Rata-rata XP Kelas</p>
              <p className="mt-2 text-3xl font-black text-amber-500">{avgXp}</p>
              <p className="text-sm text-slate-500">Dari {classStudents.length} siswa</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Rata-rata Kuis Kelas</p>
              <p className="mt-2 text-3xl font-black text-blue-500">{avgScore}%</p>
              <p className="text-sm text-slate-500">Dari {classQuizzes.length} pengerjaan</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Daftar Siswa Kelas Ini</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nama Siswa</th>
                  <th className="px-5 py-3 font-semibold text-right">Level</th>
                  <th className="px-5 py-3 font-semibold text-right">XP</th>
                  <th className="px-5 py-3 font-semibold text-center">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.sort((a:any, b:any) => b.xp - a.xp).map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{s.level}</td>
                    <td className="px-5 py-3 text-right font-bold text-amber-500">{s.xp}</td>
                    <td className="px-5 py-3 text-center">
                      {s.current_streak > 0 ? <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">🔥 {s.current_streak}</span> : '-'}
                    </td>
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">Belum ada siswa di kelas ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StudentTab({ students, quizAttempts, projectSubmissions }: any) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '')

  const studentData = students.find((s: any) => s.id === selectedStudent)
  const studentQuizzes = quizAttempts.filter((q: any) => q.user_id === selectedStudent)
  const studentProjects = projectSubmissions.filter((p: any) => p.user_id === selectedStudent)

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-slate-700">Pilih Siswa</label>
        <select 
          value={selectedStudent} 
          onChange={e => setSelectedStudent(e.target.value)}
          className="mt-1 block w-full max-w-md rounded-xl border border-slate-300 px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {studentData && (() => {
        // Analisis Sederhana
        let strengths: string[] = []
        let weaknesses: string[] = []

        const avgQuizScore = studentQuizzes.length > 0 ? studentQuizzes.reduce((s:any, q:any) => s + q.score, 0) / studentQuizzes.length : 0
        const avgProjectScore = studentProjects.length > 0 ? studentProjects.reduce((s:any, p:any) => s + (p.score || 0), 0) / studentProjects.length : 0

        if (studentData.current_streak >= 3) strengths.push('Sangat aktif dan konsisten belajar (Streak Tinggi).')
        if (avgQuizScore >= 80) strengths.push(`Sangat baik dalam pemahaman kuis (Rata-rata ${avgQuizScore.toFixed(0)}%).`)
        if (avgProjectScore >= 80) strengths.push('Mengerjakan tugas proyek dengan kualitas memuaskan.')
        
        if (studentQuizzes.length === 0) weaknesses.push('Belum pernah mengerjakan kuis sama sekali.')
        else if (avgQuizScore < 65) weaknesses.push(`Butuh bimbingan ekstra untuk materi kuis (Rata-rata ${avgQuizScore.toFixed(0)}%).`)
        
        if (studentProjects.length === 0) weaknesses.push('Belum ada satupun tugas proyek yang dikumpulkan.')
        else if (avgProjectScore < 65) weaknesses.push('Perlu didorong untuk memperbaiki kualitas tugas proyeknya.')
        else if (studentProjects.some((p:any) => p.score === null)) weaknesses.push('Ada tugas yang mengantri untuk Anda nilai.')

        if (strengths.length === 0) strengths.push('Belum ada data cukup untuk dianalisis.')
        if (weaknesses.length === 0) weaknesses.push('Tingkat pemahaman sangat baik! Tidak ada masalah signifikan.')

        return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: KPI & Insight */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-3">
                <Users className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{studentData.name}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Level</p>
                  <p className="text-xl font-bold text-slate-800">{studentData.level}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs text-amber-600 uppercase font-semibold">Total XP</p>
                  <p className="text-xl font-bold text-amber-600">{studentData.xp}</p>
                </div>
              </div>
            </div>

            {/* Insight Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-blue-900">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Analisis Singkat
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                    <TrendingUp className="h-4 w-4" /> Perkembangan (Kelebihan)
                  </p>
                  <ul className="mt-1.5 list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                
                <div className="h-px w-full bg-blue-200/50" />
                
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-rose-700">
                    <TrendingDown className="h-4 w-4" /> Kekurangan (Perlu Tindakan)
                  </p>
                  <ul className="mt-1.5 list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Submissions */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Riwayat Tugas Proyek</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {studentProjects.map((p: any) => (
                  <li key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{p.assignment?.title || 'Tugas'}</p>
                      <p className="text-xs text-slate-500">Dikumpulkan: {new Date(p.submitted_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      {p.graded_at ? (
                        <>
                          <p className="font-bold text-emerald-600">{p.score}%</p>
                          <p className="text-xs text-amber-500 font-bold">+{p.xp_earned} XP</p>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                          <AlertCircle className="h-3 w-3" /> Belum dinilai
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {studentProjects.length === 0 && (
                  <li className="p-6 text-center text-slate-500 text-sm">Belum ada tugas yang dikumpulkan.</li>
                )}
              </ul>
            </div>

            {/* Quiz Attempts */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Riwayat Kuis</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {studentQuizzes.map((q: any) => (
                  <li key={q.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{q.quiz?.title || 'Kuis'}</p>
                      <p className="text-xs text-slate-500">{new Date(q.completed_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${q.score >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>{q.score.toFixed(0)}%</p>
                      <p className="text-xs text-amber-500 font-bold">+{q.xp_earned} XP</p>
                    </div>
                  </li>
                ))}
                {studentQuizzes.length === 0 && (
                  <li className="p-6 text-center text-slate-500 text-sm">Belum ada kuis yang dikerjakan.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
