'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock, Zap, FileText, CheckCircle, AlertTriangle, Edit2, Trash2, Loader2, FlaskConical, Cpu, Wrench, Palette, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'

export default function StudentProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { confirm } = useConfirm()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [classmates, setClassmates] = useState<any[]>([])
  const [loadingClassmates, setLoadingClassmates] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUser(user)

    // Load Project details
    const { data: pData, error: pErr } = await supabase
      .from('project_assignments')
      .select('id, title, description, deadline, xp_reward, is_group_project, steam_integration, class_id, class:classes(name)')
      .eq('id', projectId)
      .single()

    if (pErr || !pData) {
      toast.error('Gagal memuat tugas')
      setLoading(false)
      return
    }
    setProject(pData)

    // Load Classmates if it's a group project
    if (pData.is_group_project) {
      setLoadingClassmates(true)
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student:users(id, name)')
        .eq('class_id', pData.class_id)
      
      const students = classStudents?.map((d: any) => Array.isArray(d.student) ? d.student[0] : d.student).filter(s => s && s.id !== user.id) || []
      setClassmates(students)
      setLoadingClassmates(false)
    }

    // Load My Submission
    const { data: sData } = await supabase
      .from('project_submissions')
      .select('*, feedback')
      .eq('assignment_id', projectId)
      
    // Filter to find the submission that belongs to me (either user_id or in group_members)
    const mySub = (sData || []).find((s: any) => {
      if (s.user_id === user.id) return true;
      if (s.group_members) {
        try {
          const parsed = typeof s.group_members === 'string' ? JSON.parse(s.group_members) : s.group_members;
          if (Array.isArray(parsed) && parsed.includes(user.id)) return true;
          if (parsed && parsed.members && Array.isArray(parsed.members) && parsed.members.includes(user.id)) return true;
        } catch (e) {}
      }
      return false;
    })

    if (mySub) {
      setSubmission(mySub)
      setFileUrl(mySub.file_url || '')
      setNotes(mySub.notes || '')
      if (mySub.group_members) {
        try {
           const parsed = typeof mySub.group_members === 'string' ? JSON.parse(mySub.group_members) : mySub.group_members;
           if (parsed.name) setGroupName(parsed.name)
           if (parsed.members) setSelectedMembers(parsed.members)
        } catch(e) {}
      }
    } else {
      setSubmission(null)
      setFileUrl('')
      setNotes('')
      setGroupName('')
      setSelectedMembers([user.id])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const handleSubmit = async () => {
    if (!fileUrl.trim()) {
      toast.error('Masukkan URL file tugas Anda')
      return
    }

    setSubmitting(true)
    try {
      let groupMembersData = null;
      if (project.is_group_project) {
        if (!groupName.trim()) {
          toast.error('Masukkan nama kelompok Anda');
          setSubmitting(false);
          return;
        }
        // Ensure current user is always included
        const finalMembers = Array.from(new Set([...selectedMembers, currentUser.id]))
        groupMembersData = JSON.stringify({
          name: groupName.trim(),
          members: finalMembers
        });
      }

      if (submission && isEditing) {
        // UPDATE existing submission via API
        const res = await fetch('/api/projects/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: submission.id,
            isEditing: true,
            assignmentId: project.id,
            userId: currentUser?.id,
            fileUrl: fileUrl.trim(),
            notes: notes.trim(),
            groupMembersData
          })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        toast.success('Tugas berhasil diperbarui! 🎉')
      } else {
        // CREATE new submission via API
        const res = await fetch('/api/projects/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: project.id,
            userId: currentUser?.id,
            fileUrl: fileUrl.trim(),
            notes: notes.trim(),
            groupMembersData
          })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        toast.success('Tugas berhasil dikumpulkan! 🎉')
      }
      
      setIsEditing(false)
      loadData()
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!submission) return
    const isConfirmed = await confirm({
      title: 'Batalkan Pengumpulan',
      message: 'Apakah Anda yakin ingin membatalkan dan menghapus pengumpulan tugas ini?',
      confirmText: 'Ya, Batalkan',
      variant: 'danger'
    })
    if (!isConfirmed) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/submit?submissionId=${submission.id}&userId=${currentUser?.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Pengumpulan tugas dibatalkan')
      setIsEditing(false)
      loadData()
    } catch(err: any) {
      toast.error(`Gagal membatalkan: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="h-4 w-32 bg-slate-200 rounded-full mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
              <div className="flex gap-4 mb-4">
                <div className="h-6 w-24 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
              </div>
              <div className="h-10 w-3/4 bg-slate-200 rounded-xl mb-6 animate-pulse" />
              <div className="h-14 w-full bg-slate-100 rounded-xl mb-8 animate-pulse" />
              <div className="space-y-4">
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-64 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Tugas Tidak Ditemukan</h2>
          <button onClick={() => router.push('/student/projects')} className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white">Kembali</button>
        </div>
      </div>
    )
  }

  const isLate = project.deadline && !submission && new Date() > new Date(project.deadline)
  const isGraded = submission && submission.score !== null

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <button 
        onClick={() => router.push('/student/projects')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Tugas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Project Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg">
                {project.class?.name || 'Unknown Class'}
              </span>
              <div className="flex items-center gap-3">
                {project.is_group_project && (
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">
                    Tugas Kelompok
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <Zap className="h-4 w-4" /> Max {project.xp_reward} XP
                </span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mb-6 leading-tight">{project.title}</h1>
            
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Clock className={cn("h-5 w-5", isLate ? "text-red-500" : "text-blue-500")} />
              <span className={cn(isLate && "text-red-600")}>
                Tenggat Waktu: {project.deadline ? new Date(project.deadline).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : 'Tidak ada tenggat'}
              </span>
            </div>

            <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-700">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Deskripsi Tugas</h3>
              <p className="whitespace-pre-wrap text-[15px]">{project.description}</p>
            </div>

            {project.steam_integration && (
              <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                    <span className="text-white font-black text-sm">STM</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Integrasi STEAM</h3>
                    <p className="text-xs font-semibold text-slate-500">Penuhi aspek-aspek berikut dalam proyek Anda</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Science */}
                  {project.steam_integration.science && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 transition-all hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-900/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <FlaskConical className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-emerald-800">Science <span className="font-normal text-emerald-600/70">(Sains)</span></h4>
                      </div>
                      <p className="text-sm text-emerald-900/80 leading-relaxed pl-10">{project.steam_integration.science}</p>
                    </div>
                  )}

                  {/* Technology */}
                  {project.steam_integration.technology && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 transition-all hover:bg-blue-50 hover:shadow-md hover:shadow-blue-900/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Cpu className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-blue-800">Technology <span className="font-normal text-blue-600/70">(Teknologi)</span></h4>
                      </div>
                      <p className="text-sm text-blue-900/80 leading-relaxed pl-10">{project.steam_integration.technology}</p>
                    </div>
                  )}

                  {/* Engineering */}
                  {project.steam_integration.engineering && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 transition-all hover:bg-amber-50 hover:shadow-md hover:shadow-amber-900/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-amber-800">Engineering <span className="font-normal text-amber-600/70">(Teknik)</span></h4>
                      </div>
                      <p className="text-sm text-amber-900/80 leading-relaxed pl-10">{project.steam_integration.engineering}</p>
                    </div>
                  )}

                  {/* Art */}
                  {project.steam_integration.art && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 transition-all hover:bg-rose-50 hover:shadow-md hover:shadow-rose-900/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                          <Palette className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-rose-800">Art <span className="font-normal text-rose-600/70">(Seni)</span></h4>
                      </div>
                      <p className="text-sm text-rose-900/80 leading-relaxed pl-10">{project.steam_integration.art}</p>
                    </div>
                  )}

                  {/* Mathematics */}
                  {project.steam_integration.mathematics && (
                    <div className="md:col-span-2 rounded-2xl border border-purple-100 bg-purple-50/50 p-4 transition-all hover:bg-purple-50 hover:shadow-md hover:shadow-purple-900/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Calculator className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-purple-800">Mathematics <span className="font-normal text-purple-600/70">(Matematika)</span></h4>
                      </div>
                      <p className="text-sm text-purple-900/80 leading-relaxed pl-10">{project.steam_integration.mathematics}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submission Status & Action */}
        <div className="space-y-6">
          <div className={cn(
            "rounded-3xl border p-6 shadow-xl transition-all duration-300",
            submission && !isEditing
              ? (isGraded ? "bg-emerald-50 border-emerald-200 shadow-emerald-900/10" : "bg-blue-50 border-blue-200 shadow-blue-900/10")
              : "bg-white border-slate-200 shadow-slate-200/50"
          )}>
            
            {/* STATUS DISPLAY */}
            {!isEditing && (
              <div className="mb-6 pb-6 border-b border-black/5">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-800">Status Pengumpulan</h3>
                {submission ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        isGraded ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                      )}>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={cn("font-bold text-lg leading-none mb-1", isGraded ? "text-emerald-700" : "text-blue-700")}>
                          Terkumpul
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {new Date(submission.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    {isGraded ? (
                      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-emerald-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-500 uppercase">Nilai</span>
                          <span className="text-lg font-black text-emerald-600">{submission.score} / 100</span>
                        </div>
                        {submission.xp_earned > 0 && (
                           <p className="text-xs font-bold text-amber-500 text-right mb-3">+{submission.xp_earned} XP</p>
                        )}
                        {submission.feedback && (
                          <div className="mt-3 pt-3 border-t border-emerald-50">
                            <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Catatan dari Guru
                            </h4>
                            <p className="text-sm text-slate-700 italic bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                              "{submission.feedback}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-blue-100 flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">Menunggu Penilaian</p>
                          <p className="text-xs text-slate-500">Guru belum memberikan nilai.</p>
                        </div>
                      </div>
                    )}

                    <a 
                      href={submission.file_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="mt-2 flex items-center justify-center gap-2 w-full rounded-xl bg-white py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-blue-500" /> Buka File Pengumpulan
                    </a>

                    {!isGraded && (
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex-1 rounded-xl bg-blue-100 text-blue-700 py-2.5 text-xs font-bold hover:bg-blue-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button 
                          onClick={handleDelete}
                          disabled={deleting}
                          className="rounded-xl bg-rose-100 text-rose-700 px-4 py-2.5 text-xs font-bold hover:bg-rose-200 transition-colors disabled:opacity-50"
                          title="Batalkan Pengumpulan"
                        >
                          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-none mb-1 text-slate-700">Belum Terkumpul</p>
                        <p className="text-xs font-medium text-slate-500">Kumpulkan sebelum tenggat.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                    >
                      Mulai Kerjakan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FORM DISPLAY */}
            {isEditing && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-5 text-slate-800">
                  {submission ? 'Edit Pengumpulan' : 'Form Pengumpulan'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Link File Tugas (Drive/Docs/PDF) <span className="text-red-500">*</span></label>
                    <input
                      type="url"
                      value={fileUrl}
                      onChange={e => setFileUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      placeholder="Ada pesan untuk guru?"
                    />
                  </div>

                  {project.is_group_project && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 space-y-4">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold text-violet-700 uppercase tracking-wider">Nama Kelompok <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={e => setGroupName(e.target.value)}
                          className="w-full rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-violet-500 focus:outline-none"
                          placeholder="Kelompok Harimau"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold text-violet-700 uppercase tracking-wider">Anggota Kelompok</label>
                        <div className="rounded-xl border border-violet-200 bg-white p-3 max-h-40 overflow-y-auto">
                          {loadingClassmates ? (
                            <p className="text-xs text-slate-500">Memuat teman...</p>
                          ) : classmates.length === 0 ? (
                            <p className="text-xs text-slate-500">Tidak ada siswa lain.</p>
                          ) : (
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked disabled className="rounded text-violet-600" />
                                <span className="font-medium">{currentUser?.name} (Kamu)</span>
                              </label>
                              {classmates.map(c => (
                                <label key={c.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                                    checked={selectedMembers.includes(c.id)}
                                    onChange={e => {
                                      if (e.target.checked) setSelectedMembers([...selectedMembers, c.id])
                                      else setSelectedMembers(selectedMembers.filter(id => id !== c.id))
                                    }}
                                  />
                                  <span>{c.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {submission && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all shadow-lg",
                        submission ? "flex-[2]" : "w-full",
                        submitting ? "opacity-70 bg-slate-400 shadow-none cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5"
                      )}
                    >
                      {submitting ? 'Menyimpan...' : (submission ? 'Simpan Perubahan' : 'Kirim Tugas')}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
