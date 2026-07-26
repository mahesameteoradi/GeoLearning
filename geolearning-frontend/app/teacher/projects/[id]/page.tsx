'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, FileText, ExternalLink, Loader2, Save } from 'lucide-react'
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
      .select('id, title, xp_reward, class:classes(name)')
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
      .select('id, file_url, notes, score, xp_earned, submitted_at, user:users(name, avatar_url)')
      .eq('assignment_id', projectId)
      .order('submitted_at', { ascending: false })

    setSubmissions(sData ?? [])
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
      
      const res = await fetch(`http://localhost:3001/v1/gamification/project/${subId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: scoreInput })
      })

      if (!res.ok) {
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

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat pengumpulan...</div>
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Tugas tidak ditemukan.</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => router.push('/teacher/projects')}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">{project.title}</h1>
          <p className="text-xs text-slate-500">{project.class?.name} • Max {project.xp_reward} XP</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-700">Daftar Pengumpulan ({submissions.length})</h2>
        </div>
        
        {submissions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">Belum ada siswa yang mengumpulkan tugas ini.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub, i) => (
              <div key={sub.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 overflow-hidden">
                    {sub.user?.avatar_url ? (
                      <img src={sub.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      sub.user?.name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{sub.user?.name || 'Siswa'}</h4>
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

                <div className="flex items-center gap-6">
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
