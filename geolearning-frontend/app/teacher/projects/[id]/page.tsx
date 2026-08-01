'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, FileText, ExternalLink, Loader2, Save, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'

export default function ProjectSubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [gradingSubId, setGradingSubId] = useState<string | null>(null)
  const [scoreInput, setScoreInput] = useState<number | ''>('')
  const [savingScore, setSavingScore] = useState(false)

  const loadData = async () => {
    setLoading(true)
    
    // Fetch project info
    const { data: pData, error: pErr } = await supabase
      .from('project_assignments')
      .select('id, title, xp_reward, class_id, is_group_project, class:classes(name)')
      .eq('id', projectId)
      .single()

    if (pErr) {
      toast.error('Gagal memuat tugas')
      setLoading(false)
      return
    }
    setProject(pData)

    // Fetch submissions
    const { data: sData } = await supabase
      .from('project_submissions')
      .select('id, file_url, notes, score, xp_earned, submitted_at, group_members, user:users(name, avatar_url)')
      .eq('assignment_id', projectId)
      .order('submitted_at', { ascending: false })

    let submissionsData = sData ?? []

    if (pData.is_group_project) {
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student:users(id, name, avatar_url)')
        .eq('class_id', pData.class_id)
      
      const classmatesMap = new Map()
      classStudents?.forEach((cs: any) => {
         const st = Array.isArray(cs.student) ? cs.student[0] : cs.student
         if (st) classmatesMap.set(st.id, st)
      })

      submissionsData = submissionsData.map((sub: any) => {
        let members: any[] = []
        let groupName = ''
        if (sub.group_members) {
          try {
            const parsed = typeof sub.group_members === 'string' ? JSON.parse(sub.group_members) : sub.group_members
            if (Array.isArray(parsed)) {
              members = parsed.map(id => classmatesMap.get(id) || { name: 'Unknown' })
            } else if (parsed && parsed.members) {
              groupName = parsed.name || ''
              members = parsed.members.map((id: string) => classmatesMap.get(id) || { name: 'Unknown' })
            }
          } catch (e) {}
        }
        return { ...sub, members, groupName }
      })
    }

    setSubmissions(submissionsData)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const handleSaveScore = async (subId: string) => {
    if (scoreInput === '' || scoreInput < 0 || scoreInput > 100) {
      toast.error('Masukkan nilai yang valid (0-100)')
      return
    }

    setSavingScore(true)
    try {
      // API call to backend to grade submission via gamification logic
      const token = (await supabase.auth.getSession()).data.session?.access_token
      
      let backendSuccess = false;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'

      try {
        const res = await fetch(`${apiUrl}/gamification/project/${subId}/grade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ score: Number(scoreInput) })
        })
        if (res.ok) {
          backendSuccess = true;
        } else {
          console.warn('Backend returned error:', await res.text());
        }
      } catch (fetchErr) {
        console.warn('Backend unavailable, falling back to direct DB update', fetchErr)
      }

      if (!backendSuccess) {
        // Fallback if backend route isn't set up yet, we will just update DB
        const calculatedXp = Math.round(project.xp_reward * (Number(scoreInput) / 100))
        
        const { error } = await supabase
          .from('project_submissions')
          .update({
            score: Number(scoreInput),
            xp_earned: calculatedXp,
            graded_at: new Date().toISOString()
          })
          .eq('id', subId)
          
        if (error) throw error
      }

      toast.success('Nilai berhasil disimpan!')
      setGradingSubId(null)
      setScoreInput('')
      loadData()
    } catch (err: any) {
      toast.error(`Gagal menyimpan nilai: ${err.message}`)
    } finally {
      setSavingScore(false)
    }
  }

  function exportCSV() {
    if (!project) return
    const rows = [
      ['Nama / Kelompok', 'Nilai', 'XP', 'Waktu Pengumpulan'],
      ...submissions.map(sub => {
        const name = project.is_group_project && sub.members?.length > 0 
          ? `${sub.groupName ? 'Kel. ' + sub.groupName + ' ' : ''}(${(sub.members as any[]).map(m => m.name).join('; ')})`
          : (sub.user?.name || 'Siswa')
        return [
          name,
          sub.score !== null ? sub.score.toString() : 'Belum Dinilai',
          sub.xp_earned?.toString() ?? '0',
          new Date(sub.submitted_at).toLocaleString('id-ID'),
        ]
      })
    ]
    // Escape quotes and format as CSV
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hasil-proyek-${project.title.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat pengumpulan...</div>
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Tugas tidak ditemukan.</div>
  }

  return (
    <div className="min-h-screen p-5 lg:p-7">
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/teacher/projects')}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-110 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">{project.title}</h1>
              <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">{project.class?.name} • Max {project.xp_reward} XP</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xl shadow-slate-200/40">
        <div className="border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm px-6 py-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Daftar Pengumpulan ({submissions.length})</h2>
          
          {submissions.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          )}
        </div>
        
        {submissions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">Belum ada siswa yang mengumpulkan tugas ini.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub, i) => (
              <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 transition-colors hover:bg-indigo-50/30 group">
                <div className="flex items-start md:items-center gap-3 md:gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 overflow-hidden">
                    {sub.user?.avatar_url ? (
                      <img src={sub.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      sub.user?.name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div>
                    {project.is_group_project && sub.members?.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-0.5">
                          {sub.groupName ? `Kelompok: ${sub.groupName}` : 'Kelompok'} ({(sub.members as any[]).length} orang)
                        </h4>
                        <p className="text-[10px] text-slate-500 mb-1 leading-tight">
                          {(sub.members as any[]).map(m => m.name).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <h4 className="text-sm font-bold text-slate-800">{sub.user?.name || 'Siswa'}</h4>
                    )}
                    <p className="text-[10px] text-slate-500">
                      Dikumpulkan: {new Date(sub.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    {sub.notes && (
                      <div className="mt-1.5 rounded bg-slate-100 px-2 py-1 flex items-start gap-1 max-w-sm">
                        <FileText className="h-3 w-3 text-slate-600 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] italic text-slate-600 line-clamp-2">{sub.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full md:w-auto">
                  <a 
                    href={sub.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Buka File
                  </a>
                  
                  <div className="w-[1px] h-8 bg-slate-200" />
                  
                  {sub.score !== null ? (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-bold">{sub.score} / 100</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600">+{sub.xp_earned} XP</span>
                      <button 
                        onClick={() => {
                          setScoreInput(sub.score)
                          setGradingSubId(sub.id)
                        }}
                        className="text-[10px] text-slate-600 hover:text-blue-600 mt-1"
                      >
                        Edit Nilai
                      </button>
                    </div>
                  ) : gradingSubId === sub.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        min="0" max="100"
                        value={scoreInput}
                        onChange={(e) => setScoreInput(Number(e.target.value))}
                        className="w-16 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="100"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveScore(sub.id)}
                        disabled={savingScore}
                        className="rounded bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {savingScore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => setGradingSubId(null)}
                        className="rounded bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300"
                      >
                        Tutup
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setScoreInput('')
                        setGradingSubId(sub.id)
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      Beri Nilai
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
