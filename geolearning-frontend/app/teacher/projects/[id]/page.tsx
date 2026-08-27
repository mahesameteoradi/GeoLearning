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
  const [feedbackInput, setFeedbackInput] = useState<string>('')
  const [savingScore, setSavingScore] = useState(false)

  const loadData = async () => {
    setLoading(true)
    
    // Fetch project info
    const { data: pData, error: pErr } = await supabase
      .from('project_assignments')
      .select('id, title, xp_reward, class_id, is_group_project, instruction_file_url, class:classes(name)')
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
      .select('id, file_url, notes, feedback, score, xp_earned, submitted_at, group_members, user:users(name, avatar_url)')
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
          body: JSON.stringify({ score: Number(scoreInput), feedback: feedbackInput || undefined })
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
            feedback: feedbackInput || null,
            xp_earned: calculatedXp,
            graded_at: new Date().toISOString()
          })
          .eq('id', subId)
          
        if (error) throw error
      }

      toast.success('Nilai berhasil disimpan!')
      setGradingSubId(null)
      setScoreInput('')
      setFeedbackInput('')
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
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#0B1120] p-8 shadow-md border border-slate-800">
        
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
              <p className="mt-1.5 text-blue-100/80 max-w-xl text-sm leading-relaxed">{project.class?.name} • Max {project.xp_reward} XP</p>
              {project.instruction_file_url && (
                <a 
                  href={project.instruction_file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  <FileText className="h-4 w-4" /> Lihat File Panduan Proyek
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-md shadow-slate-200/40">
        <div className="border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm px-6 py-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Daftar Pengumpulan ({submissions.length})</h2>
          
          {submissions.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-1.5 text-xs font-bold text-green-600 hover:bg-green-50 transition-colors shadow-sm"
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
              <div key={sub.id} className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 md:p-6 transition-colors hover:bg-blue-50/30 group">
                <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1">
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
                      <div className="mt-1.5 rounded bg-slate-50 px-2 py-1 flex items-start gap-1 max-w-sm">
                        <FileText className="h-3 w-3 text-slate-600 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] italic text-slate-600 line-clamp-2">Catatan Siswa: {sub.notes}</span>
                      </div>
                    )}
                    {sub.feedback && (
                      <div className="mt-1.5 rounded bg-blue-50 px-2 py-1 flex items-start gap-1 max-w-sm border border-blue-100">
                        <CheckCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] text-blue-700">Feedback Guru: {sub.feedback}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-start gap-4 md:gap-6 w-full md:w-auto mt-4 md:mt-0">
                  <a 
                    href={sub.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Buka File
                  </a>
                  
                  <div className="hidden md:block w-[1px] h-16 bg-slate-200" />
                  
                  {sub.score !== null ? (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-bold">{sub.score} / 100</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600">+{sub.xp_earned} XP</span>
                      <button 
                        onClick={() => {
                          setScoreInput(sub.score)
                          setFeedbackInput(sub.feedback || '')
                          setGradingSubId(sub.id)
                        }}
                        className="text-[10px] text-slate-600 hover:text-blue-600 mt-1"
                      >
                        Edit Nilai
                      </button>
                    </div>
                  ) : gradingSubId === sub.id ? (
                    <div className="flex flex-col gap-3 w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-xl p-4">


                      <div className="flex w-full items-center justify-end gap-2">
                        <span className="text-xs font-semibold text-slate-700">Nilai Akhir:</span>
                        <input 
                          type="number"
                          min="0" max="100"
                          value={scoreInput}
                          onChange={(e) => setScoreInput(Number(e.target.value))}
                          className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                          placeholder="0-100"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleSaveScore(sub.id)}
                          disabled={savingScore}
                          className="rounded bg-green-500 py-1.5 px-4 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex justify-center items-center gap-1.5"
                        >
                          {savingScore ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Simpan</>}
                        </button>
                        <button 
                          onClick={() => {
                            setGradingSubId(null)
                            setFeedbackInput('')
                          }}
                          className="rounded border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                        >
                          Tutup
                        </button>
                      </div>
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        className="w-full h-20 rounded border border-slate-300 p-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                        placeholder="Tambahkan feedback / catatan untuk siswa terkait evaluasi tugas mereka (Opsional)"
                      />
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setScoreInput('')
                        setFeedbackInput('')
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
