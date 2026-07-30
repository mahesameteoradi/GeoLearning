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
import { ClassLeaderboard } from '@/components/classes/ClassLeaderboard'
import { ClassStudentsPanel } from '@/components/teacher/ClassStudentsPanel'
import { Trophy, Map as MapIcon, MapPin } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type FileCategory = 'pdf' | 'video' | 'ppt' | 'doc' | 'link' | 'image'
type PageTab = 'materi' | 'kuis' | 'peringkat' | 'siswa'

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
    <div className={cn('group flex items-start gap-4 rounded-3xl border border-slate-200/80 p-5 transition-all duration-300 bg-white hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 hover:border-indigo-300/50')}>
      <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border', meta.bg, meta.border)}>
        <Icon className={cn('h-5 w-5', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{mat.title}</h3>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm', meta.bg, meta.color)}>{meta.label}</span>
        </div>
        {mat.content_text && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{mat.content_text}</p>}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
        {mat.type === 'INTERACTIVE_MAP' ? (
          <button onClick={() => onViewMap(mat)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
            <Eye className="h-4 w-4" />
          </button>
        ) : mat.content_url && (
          <a href={mat.content_url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
            {cat === 'link' ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </a>
        )}
        <button onClick={() => onDelete(mat.id, mat.content_url)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
          <Trash2 className="h-4 w-4" />
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
    { key: 'siswa'  as PageTab, label: 'Siswa',  icon: Users },
    { key: 'materi' as PageTab, label: 'Materi', icon: BookOpen, count: materials.length },
    { key: 'peringkat' as PageTab, label: 'Peringkat', icon: Trophy },
  ]

  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Back */}
      <Link href="/teacher/classes" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />Kembali ke Daftar Kelas
      </Link>

      {/* Class Header */}
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 text-2xl font-black text-white shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3 drop-shadow-md">
              {cls.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">{cls.name}</h1>
              {cls.description && <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">{cls.description}</p>}
              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs font-bold tracking-wider text-white shadow-inner backdrop-blur-sm">
                  <Hash className="h-3.5 w-3.5" />{cls.join_code}
                </span>
              </div>
            </div>
          </div>
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

      {activeTab === 'materi' && (
        <div className="space-y-6">
          {/* Interactive Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={handleOpenModal} disabled={initializingModule} className="group flex items-center gap-5 p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                {initializingModule ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">Unggah File / Link</h3>
                <p className="text-sm text-slate-500 mt-1">PDF, Video, Dokumen, atau Tautan Luar</p>
              </div>
            </button>
            <button onClick={handleOpenMapEditor} disabled={initializingModule} className="group flex items-center gap-5 p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                {initializingModule ? <Loader2 className="h-6 w-6 animate-spin" /> : <MapPin className="h-7 w-7" />}
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Buat Peta Interaktif</h3>
                <p className="text-sm text-slate-500 mt-1">Editor peta visual dengan penanda kustom</p>
              </div>
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-300 bg-blue-50">
                <BookOpen className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Belum ada materi tersimpan</p>
              <p className="mt-1.5 max-w-xs text-xs text-slate-600">Gunakan menu di atas untuk mulai menambahkan materi pembelajaran ke dalam kelas ini.</p>
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">📚 Daftar Materi ({materials.length})</h2>
              <div className="space-y-3">
                {materials.map(mat => <MaterialCard key={mat.id} mat={mat} onDelete={handleDeleteMaterial} onViewMap={setViewingMap} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'siswa' && (
        <ClassStudentsPanel classId={cls.id} />
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
