'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Plus, Loader2, Trash2, ExternalLink,
  FileText, Video, Presentation, Link as LinkIcon,
  FileImage, Download, BookOpen, Hash, X,
  UploadCloud, CheckCircle, ClipboardList,
  Eye, EyeOff, Edit3, BarChart3, Clock, Star, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { InteractiveMapEditorModal } from '@/components/teacher/InteractiveMapEditorModal'
import { InteractiveMapViewer } from '@/components/ui/InteractiveMapViewer'
import { cn } from '@/lib/utils/cn'
import { QuizEditorModal } from '@/components/teacher/QuizEditorModal'
import { QuizResultsModal } from '@/components/teacher/QuizResultsModal'
import { ChatPanel } from '@/components/forum/ChatPanel'
import { ClassLeaderboard } from '@/components/classes/ClassLeaderboard'
import { MessageSquare, Trophy, Map as MapIcon, MapPin } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type FileCategory = 'pdf' | 'video' | 'ppt' | 'doc' | 'link' | 'image'
type PageTab = 'materi' | 'kuis' | 'forum' | 'peringkat'

interface MaterialItem {
  id: string
  module_id: string
  title: string
  type: string
  content_url: string | null
  content_text: string | null
  order: number
  created_at: string
}

interface ModuleItem {
  id: string
  class_id: string
  title: string
  materials: MaterialItem[]
}

interface ClassData {
  id: string
  name: string
  description: string | null
  join_code: string
  modules: ModuleItem[]
}

interface QuizItem {
  id: string
  title: string
  class_id: string | null
  module_id: string | null
  time_limit: number | null
  xp_reward: number
  is_published: boolean
  created_at: string
  question_count: number
  attempt_count: number
  avg_score: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryFromUrl(url: string | null, type: string): FileCategoryExpanded {
  if (type === 'VIDEO') return 'video'
  if (type === 'INTERACTIVE_MAP') return 'interactive_map'
  if (type === 'LINK' && !url?.match(/\.(pdf|pptx|ppt|docx|doc|png|jpg|gif|webp)$/i)) return 'link'
  if (!url) return 'link'
  const ext = url.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
  if (['ppt', 'pptx'].includes(ext)) return 'ppt'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image'
  return 'pdf'
}

type FileCategoryExpanded = FileCategory | 'interactive_map'

const CATEGORY_META: Record<FileCategoryExpanded, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  pdf:   { icon: FileText,     color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'PDF' },
  video: { icon: Video,        color: 'text-blue-400',   bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'Video' },
  ppt:   { icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Presentasi' },
  doc:   { icon: FileText,     color: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-200',    label: 'Dokumen' },
  link:  { icon: LinkIcon,     color: 'text-blue-600', bg: 'bg-violet-50', border: 'border-blue-300', label: 'Link' },
  image: { icon: FileImage,    color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',label: 'Gambar' },
  interactive_map: { icon: MapIcon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Peta Interaktif' },
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}d`
  return `${Math.floor(seconds / 60)} mnt`
}

// ─── Material Card ────────────────────────────────────────────────────────────

function MaterialCard({ mat, onDelete, onViewMap }: { mat: MaterialItem; onDelete: (id: string, url: string | null) => void; onViewMap: (mat: MaterialItem) => void }) {
  const cat = getCategoryFromUrl(mat.content_url, mat.type) as FileCategoryExpanded
  const meta = CATEGORY_META[cat]
  const Icon = meta.icon
  return (
    <div className={cn('group flex items-start gap-4 rounded-2xl border p-4 transition-all bg-white hover:shadow-lg', meta.border)}>
      <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', meta.bg, meta.border, 'border')}>
        <Icon className={cn('h-5 w-5', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-slate-900 truncate">{mat.title}</h3>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.bg, meta.color)}>{meta.label}</span>
        </div>
        {mat.content_text && <p className="text-xs text-slate-500 line-clamp-2">{mat.content_text}</p>}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
        {mat.type === 'INTERACTIVE_MAP' ? (
          <button onClick={() => onViewMap(mat)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
            <Eye className="h-3.5 w-3.5" />
          </button>
        ) : mat.content_url && (
          <a href={mat.content_url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 hover:text-white transition-colors">
            {cat === 'link' ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
          </a>
        )}
        <button onClick={() => onDelete(mat.id, mat.content_url)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

type UploadTab = 'pdf' | 'video' | 'ppt' | 'doc' | 'link'
const UPLOAD_TABS: { key: UploadTab; label: string; icon: React.ElementType; accept: string; dbType: string }[] = [
  { key: 'pdf',   label: 'PDF',        icon: FileText,     accept: '.pdf',                 dbType: 'PDF'   },
  { key: 'video', label: 'Video',      icon: Video,        accept: '.mp4,.webm,.mov,.avi', dbType: 'VIDEO' },
  { key: 'ppt',   label: 'Presentasi', icon: Presentation, accept: '.ppt,.pptx',           dbType: 'PDF'   },
  { key: 'doc',   label: 'Dokumen',    icon: FileText,     accept: '.doc,.docx',           dbType: 'PDF'   },
  { key: 'link',  label: 'Link',       icon: LinkIcon,     accept: '',                     dbType: 'LINK'  },
]

function UploadMaterialModal({ classId, moduleId, onClose, onSuccess }: {
  classId: string; moduleId: string; onClose: () => void; onSuccess: (mat: MaterialItem) => void
}) {
  const [tab, setTab] = useState<UploadTab>('pdf')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentTab = UPLOAD_TABS.find(t => t.key === tab)!
  const isLink = tab === 'link'

  function handleFile(f: File) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (isLink && !linkUrl.trim()) return
    if (!isLink && !file) return
    setUploading(true); setUploadProgress(0)
    const supabase = createClient()
    let contentUrl: string | null = null
    try {
      if (!isLink && file) {
        const ext = file.name.split('.').pop()
        const path = `${classId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
        setUploadProgress(20)
        const { error: uploadErr } = await supabase.storage.from('class-materials').upload(path, file, { cacheControl: '3600', upsert: false })
        if (uploadErr) throw new Error(uploadErr.message)
        setUploadProgress(70)
        const { data: { publicUrl } } = supabase.storage.from('class-materials').getPublicUrl(path)
        contentUrl = publicUrl
      } else { contentUrl = linkUrl.trim() }
      setUploadProgress(85)
      const { data: mat, error: matErr } = await supabase.from('materials').insert({
        id: crypto.randomUUID(), module_id: moduleId, title: title.trim(), type: currentTab.dbType,
        content_url: contentUrl, content_text: description.trim() || null, order: 0,
        updated_at: new Date().toISOString(),
      }).select().single()
      if (matErr) throw new Error(matErr.message)
      setUploadProgress(100)
      toast.success('Materi berhasil diunggah! 🎉')
      onSuccess(mat as MaterialItem)
      onClose()
    } catch (err) {
      toast.error(`Gagal mengunggah: ${err instanceof Error ? err.message : 'Error'}`)
    } finally { setUploading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/60">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100"><Plus className="h-4 w-4 text-blue-600" /></div>
            <h2 className="text-base font-bold text-slate-800">Tambah Materi</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-5 grid grid-cols-5 gap-1.5">
          {UPLOAD_TABS.map((t) => {
            const Icon = t.icon; const meta = CATEGORY_META[t.key]
            return (
              <button key={t.key} type="button" onClick={() => { setTab(t.key); setFile(null) }}
                className={cn('flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[10px] font-semibold transition-all',
                  tab === t.key ? `${meta.bg} ${meta.border} ${meta.color}` : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-500')}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            )
          })}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Judul Materi <span className="text-red-600">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} placeholder="Contoh: Bab 1 — Pengertian Geografi"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Deskripsi <span className="text-slate-600">(opsional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={500} placeholder="Jelaskan isi materi ini…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30" />
          </div>
          {isLink ? (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">URL <span className="text-red-600">*</span></label>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} required type="url" placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30" />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">File <span className="text-red-600">*</span></label>
              <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => fileInputRef.current?.click()}
                className={cn('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-center transition-all',
                  dragOver ? 'border-blue-500 bg-blue-50' : file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300')}>
                {file ? (<><CheckCircle className="h-6 w-6 text-emerald-600" /><p className="text-xs font-semibold text-emerald-600">{file.name}</p><p className="text-[11px] text-slate-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p></>)
                  : (<><UploadCloud className="h-7 w-7 text-slate-600" /><p className="text-xs font-semibold text-slate-500">Drag &amp; drop atau klik untuk pilih file</p><p className="text-[11px] text-slate-600">{currentTab.accept.replace(/\./g, '').toUpperCase()} · Maks. 100MB</p></>)}
              </div>
              <input ref={fileInputRef} type="file" accept={currentTab.accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-500"><span>Mengunggah…</span><span>{uploadProgress}%</span></div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} disabled={uploading} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-800 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={uploading || !title.trim() || (isLink ? !linkUrl.trim() : !file)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Mengunggah…</> : <><UploadCloud className="h-4 w-4" />Unggah Materi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Quiz Panel (tab) ─────────────────────────────────────────────────────────

function QuizPanel({ classId, className }: { classId: string; className: string }) {
  const supabase = createClient()
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null)
  const [viewingResults, setViewingResults] = useState<QuizItem | null>(null)

  const classOption = [{ id: classId, name: className }]

  const loadQuizzes = useCallback(async () => {
    const { data: rawQuizzes } = await supabase
      .from('quizzes')
      .select('id, title, class_id, module_id, time_limit, xp_reward, is_published, created_at, questions(id), quiz_attempts(score, user_id)')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    const mapped: QuizItem[] = (rawQuizzes ?? []).map(q => {
      const attempts = (q.quiz_attempts as { score: number; user_id: string }[]) ?? []
      const completed = attempts.filter(a => a.score >= 0)
      const avgScore = completed.length > 0 ? completed.reduce((s, a) => s + a.score, 0) / completed.length : null
      return {
        id: q.id, title: q.title, class_id: q.class_id, module_id: q.module_id,
        time_limit: q.time_limit, xp_reward: q.xp_reward, is_published: q.is_published,
        created_at: q.created_at, question_count: (q.questions as { id: string }[]).length,
        attempt_count: attempts.length, avg_score: avgScore,
      }
    })
    setQuizzes(mapped)
    setLoading(false)
  }, [classId, supabase])

  useEffect(() => { loadQuizzes() }, [loadQuizzes])

  async function handleDelete(id: string) {
    if (!confirm('Hapus kuis ini beserta semua data pengerjaannya?')) return
    const { error } = await supabase.from('quizzes').delete().eq('id', id)
    if (error) { toast.error('Gagal menghapus kuis'); return }
    toast.success('Kuis dihapus')
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  async function handleTogglePublish(id: string, current: boolean) {
    const { error } = await supabase.from('quizzes').update({ is_published: !current, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Gagal mengubah status'); return }
    toast.success(!current ? '✅ Kuis dipublikasikan! Siswa sudah bisa mengerjakan.' : 'Kuis disimpan sebagai draft')
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, is_published: !current } : q))
  }

  if (loading) return <div className="py-12 text-center text-slate-600"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">{quizzes.length} kuis dalam kelas ini</p>
        <button onClick={() => { setEditingQuiz(null); setShowEditor(true) }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500">
          <Plus className="h-4 w-4" />Buat Kuis
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
            <ClipboardList className="h-7 w-7 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada kuis</p>
          <p className="mt-1 text-xs text-slate-600">Buat kuis gamifikasi untuk menguji pemahaman siswa</p>
          <button onClick={() => { setEditingQuiz(null); setShowEditor(true) }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            <Plus className="h-4 w-4" />Buat Kuis Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border',
                      quiz.is_published ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                      {quiz.is_published ? '● Published' : '○ Draft'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{quiz.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{quiz.question_count} soal</span>
                    {quiz.time_limit && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(quiz.time_limit)}</span>}
                    <span className="flex items-center gap-1 text-amber-600"><Star className="h-3 w-3" />+{quiz.xp_reward} XP</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{quiz.attempt_count} mengerjakan</span>
                    {quiz.avg_score !== null && <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />Avg {quiz.avg_score.toFixed(0)}%</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setViewingResults(quiz)} title="Lihat hasil"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-cyan-50 hover:text-cyan-600 transition-colors">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { setEditingQuiz(quiz); setShowEditor(true) }} title="Edit kuis"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleTogglePublish(quiz.id, quiz.is_published)} title={quiz.is_published ? 'Sembunyikan' : 'Publikasikan'}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                    {quiz.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(quiz.id)} title="Hapus"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <QuizEditorModal
          classes={classOption}
          quiz={editingQuiz}
          onClose={() => { setShowEditor(false); setEditingQuiz(null) }}
          onSaved={loadQuizzes}
        />
      )}
      {viewingResults && (
        <QuizResultsModal quiz={viewingResults} onClose={() => setViewingResults(null)} />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClassDetailClient({ cls, teacherId }: { cls: ClassData; teacherId: string }) {
  const initialMaterials = cls.modules.flatMap(m => m.materials)
  const [materials, setMaterials] = useState<MaterialItem[]>(initialMaterials)
  const [moduleId, setModuleId] = useState<string | null>(cls.modules.length > 0 ? cls.modules[0].id : null)
  const [showModal, setShowModal] = useState(false)
  const [showMapEditor, setShowMapEditor] = useState(false)
  const [viewingMap, setViewingMap] = useState<MaterialItem | null>(null)
  const [initializingModule, setInitializingModule] = useState(false)
  const [activeTab, setActiveTab] = useState<PageTab>('materi')

  async function ensureModuleExists(): Promise<string | null> {
    if (moduleId) return moduleId
    setInitializingModule(true)
    const supabase = createClient()
    const newId = crypto.randomUUID()
    const { data, error } = await supabase.from('modules').insert({ id: newId, class_id: cls.id, title: 'Materi Kelas', order: 0, updated_at: new Date().toISOString() }).select('id').single()
    setInitializingModule(false)
    if (error || !data) { console.error('Module insertion error:', error); toast.error('Gagal inisialisasi modul'); return null }
    setModuleId(data.id)
    return data.id
  }

  async function handleOpenModal() { const mid = await ensureModuleExists(); if (mid) setShowModal(true) }
  async function handleOpenMapEditor() { const mid = await ensureModuleExists(); if (mid) setShowMapEditor(true) }
  function handleMaterialAdded(mat: MaterialItem) { setMaterials(prev => [mat, ...prev]) }

  async function handleDeleteMaterial(id: string, storageUrl: string | null) {
    if (!confirm('Hapus materi ini?')) return
    const supabase = createClient()
    if (storageUrl?.includes('supabase')) {
      const pathMatch = storageUrl.match(/class-materials\/(.+)$/)
      if (pathMatch) await supabase.storage.from('class-materials').remove([pathMatch[1]])
    }
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (!error) { setMaterials(prev => prev.filter(m => m.id !== id)); toast.success('Materi dihapus') }
    else toast.error('Gagal menghapus materi')
  }

  const TABS = [
    { key: 'materi' as PageTab, label: 'Materi', icon: BookOpen, count: materials.length },
    { key: 'kuis'   as PageTab, label: 'Kuis',   icon: ClipboardList },
    { key: 'forum'  as PageTab, label: 'Forum',  icon: MessageSquare },
    { key: 'peringkat' as PageTab, label: 'Peringkat', icon: Trophy },
  ]

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Back */}
      <Link href="/teacher/classes" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />Kembali ke Daftar Kelas
      </Link>

      {/* Class Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-2xl font-extrabold text-white shadow-lg shadow-blue-600/20">
              {cls.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{cls.name}</h1>
              {cls.description && <p className="mt-0.5 text-sm text-slate-500">{cls.description}</p>}
              <div className="mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-500">
                  <Hash className="h-3 w-3" />{cls.join_code}
                </span>
              </div>
            </div>
          </div>
          {/* Tab-aware action button */}
          {activeTab === 'materi' && (
            <div className="flex gap-2">
              <button onClick={handleOpenModal} disabled={initializingModule}
                className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
                {initializingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Tambah Materi
              </button>
              <button onClick={handleOpenMapEditor} disabled={initializingModule}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60">
                {initializingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                Buat Peta Interaktif
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              activeTab === key ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-700')}>
            <Icon className="h-4 w-4" />
            {label}
            {count !== undefined && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'materi' && (
        <>
          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-28 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-300 bg-blue-50">
                <BookOpen className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Belum ada materi</p>
              <p className="mt-1.5 max-w-xs text-xs text-slate-600">Klik tombol &quot;Tambah Materi&quot; untuk mulai mengunggah PDF, video, presentasi, atau link</p>
              <button onClick={handleOpenModal} disabled={initializingModule}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">
                <Plus className="h-4 w-4" />Tambah Materi Pertama
              </button>
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">📚 Daftar Materi ({materials.length})</h2>
              <div className="space-y-3">
                {materials.map(mat => <MaterialCard key={mat.id} mat={mat} onDelete={handleDeleteMaterial} onViewMap={setViewingMap} />)}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'kuis' && (
        <QuizPanel classId={cls.id} className={cls.name} />
      )}

      {activeTab === 'forum' && (
        <div className="h-[600px] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <ChatPanel roomId={cls.id} roomName={cls.name} userId={teacherId} />
        </div>
      )}

      {activeTab === 'peringkat' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ClassLeaderboard classId={cls.id} />
        </div>
      )}

      {/* Upload Modal */}
      {showModal && moduleId && (
        <UploadMaterialModal classId={cls.id} moduleId={moduleId} onClose={() => setShowModal(false)} onSuccess={handleMaterialAdded} />
      )}

      {/* Map Editor Modal */}
      {showMapEditor && moduleId && (
        <InteractiveMapEditorModal 
          moduleId={moduleId} 
          title={`Peta Interaktif: ${cls.name}`}
          onClose={() => setShowMapEditor(false)} 
          onSuccess={handleMaterialAdded} 
        />
      )}

      {/* Map Viewer */}
      {viewingMap && (
        <InteractiveMapViewer
          title={viewingMap.title}
          dataString={viewingMap.content_text}
          onClose={() => setViewingMap(null)}
        />
      )}
    </div>
  )
}
