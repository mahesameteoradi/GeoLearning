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
  ArrowUp, ArrowDown, Settings, ChevronUp, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { InteractiveMapEditorModal } from '@/components/teacher/InteractiveMapEditorModal'
import { QuizEditorModal } from '@/components/teacher/QuizEditorModal'
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
  order?: number
  materials: MaterialItem[]
  quizzes?: QuizItem[]
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
  order: number
  is_published: boolean
  created_at: string
}

export type CourseItemType = 'material' | 'quiz'

export interface CourseItem {
  id: string
  module_id: string | null
  title: string
  order: number
  itemType: CourseItemType
  created_at: string
  
  // material specific
  type?: string
  content_url?: string | null
  content_text?: string | null
  
  // quiz specific
  time_limit?: number | null
  xp_reward?: number
  is_published?: boolean
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

function CourseItemCard({ 
  item, index, total, onMove, onDelete, onViewMap, onEditQuiz, onEditMaterial
}: { 
  item: CourseItem; 
  index: number; 
  total: number;
  onMove: (id: string, type: CourseItemType, dir: 'up'|'down') => void;
  onDelete: (id: string, type: CourseItemType, url: string | null) => void; 
  onViewMap: (item: CourseItem) => void;
  onEditQuiz: (item: CourseItem) => void;
  onEditMaterial: (item: CourseItem) => void;
}) {
  const isMaterial = item.itemType === 'material'
  
  let cat: FileCategoryExpanded = 'pdf'
  let meta = CATEGORY_META.pdf
  let Icon: React.ElementType = FileText

  if (isMaterial) {
    cat = getCategoryFromUrl(item.content_url || null, item.type || 'TEXT') as FileCategoryExpanded
    meta = CATEGORY_META[cat]
    Icon = meta.icon
  } else {
    Icon = ClipboardList
    meta = { icon: ClipboardList, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', label: 'Kuis' }
  }

  return (
    <div className={cn('group flex items-start gap-4 rounded-3xl border border-slate-200/80 p-4 transition-all duration-300 bg-white hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 hover:border-indigo-300/50')}>
      <div className="flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button disabled={index === 0} onClick={() => onMove(item.id, item.itemType, 'up')} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
        <button disabled={index === total - 1} onClick={() => onMove(item.id, item.itemType, 'down')} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
      </div>

      <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border', meta.bg, meta.border)}>
        <Icon className={cn('h-5 w-5', meta.color)} />
      </div>
      
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h3>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm', meta.bg, meta.color)}>{meta.label}</span>
          {!item.is_published && !isMaterial && (
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm bg-slate-100 text-slate-500">Draft</span>
          )}
        </div>
        {item.content_text && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.content_text}</p>}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 py-1 opacity-0 transition-all group-hover:opacity-100">
        {isMaterial && item.type === 'INTERACTIVE_MAP' ? (
          <button onClick={() => onViewMap(item)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
            <Eye className="h-4 w-4" />
          </button>
        ) : isMaterial && item.content_url && (
          <a href={item.content_url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
            {cat === 'link' ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </a>
        )}
        {!isMaterial && (
          <button onClick={() => onEditQuiz(item)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600 transition-all shadow-sm">
            <Settings className="h-4 w-4" />
          </button>
        )}
        {isMaterial && (
          <button onClick={() => onEditMaterial(item)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm">
            <Edit3 className="h-4 w-4" />
          </button>
        )}
        {isMaterial && (
          <button onClick={() => onDelete(item.id, item.itemType, item.content_url || null)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
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

import { useConfirm } from '@/components/ui/ConfirmProvider'

function UploadMaterialModal({ classId, existingModules, nextOrderMap, onClose, onSuccess, onModuleAdded, editMaterial }: {
  classId: string; existingModules: {id: string, title: string}[]; nextOrderMap?: Record<string, number>; onClose: () => void; onSuccess: (mat: MaterialItem, newModule?: any, isUpdate?: boolean) => void; onModuleAdded: (mod: any) => void; editMaterial?: CourseItem | null
}) {
  const { confirm } = useConfirm()
  const [tab, setTab] = useState<UploadTab>(() => {
    if (editMaterial) {
      if (editMaterial.type === 'VIDEO') return 'video'
      if (editMaterial.type === 'LINK' && !editMaterial.content_url?.match(/\.(pdf|pptx|ppt|docx|doc|png|jpg|gif|webp)$/i)) return 'link'
      if (!editMaterial.content_url) return 'link'
      const ext = editMaterial.content_url.split('.').pop()?.toLowerCase() ?? ''
      if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
      if (['ppt', 'pptx'].includes(ext)) return 'ppt'
      if (['doc', 'docx'].includes(ext)) return 'doc'
      return 'pdf'
    }
    return 'pdf'
  })
  const [selectedModuleId, setSelectedModuleId] = useState<string>(editMaterial?.module_id || existingModules[0]?.id || 'new')
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editedModuleTitle, setEditedModuleTitle] = useState('')
  const [isUpdatingModule, setIsUpdatingModule] = useState(false)
  const [order, setOrder] = useState<number>(editMaterial?.order ?? (nextOrderMap?.[existingModules[0]?.id || 'new'] ?? 1))
  const [title, setTitle] = useState(editMaterial?.title || '')
  const [description, setDescription] = useState(editMaterial?.content_text || '')
  const [linkUrl, setLinkUrl] = useState(editMaterial?.type === 'LINK' ? (editMaterial.content_url || '') : '')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentTab = UPLOAD_TABS.find(t => t.key === tab)!
  const isLink = tab === 'link'

  useEffect(() => {
    if (!editMaterial && selectedModuleId !== 'new' && nextOrderMap) {
      setOrder(nextOrderMap[selectedModuleId] || 1)
    } else if (!editMaterial && selectedModuleId === 'new') {
      setOrder(1)
    }
  }, [selectedModuleId, editMaterial, nextOrderMap])

  async function handleSaveModuleEdit() {
    if (!editedModuleTitle.trim() || !editingModuleId) return
    setIsUpdatingModule(true)
    const supabase = createClient()
    const { error } = await supabase.from('modules').update({ title: editedModuleTitle.trim() }).eq('id', editingModuleId)
    setIsUpdatingModule(false)
    if (error) { toast.error('Gagal memperbarui nama bab') } 
    else { toast.success('Nama bab diperbarui'); setEditingModuleId(null); window.location.reload() }
  }

  async function handleDeleteModule(modId: string) {
    const isConfirmed = await confirm({
      title: 'Hapus Bab',
      message: 'Hapus bab ini? (Semua materi dan kuis di dalamnya akan ikut terhapus!)',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setIsUpdatingModule(true)
    const supabase = createClient()
    const { error } = await supabase.from('modules').delete().eq('id', modId)
    setIsUpdatingModule(false)
    if (error) { toast.error('Gagal menghapus bab') } 
    else { toast.success('Bab berhasil dihapus'); window.location.reload() }
  }

  async function handleSaveNewModule() {
    if (!newModuleTitle.trim()) return
    setIsUpdatingModule(true)
    const supabase = createClient()
    const targetModuleId = crypto.randomUUID()
    const { data: modData, error: modErr } = await supabase.from('modules').insert({
      id: targetModuleId, class_id: classId, title: newModuleTitle.trim(), order: existingModules.length, updated_at: new Date().toISOString()
    }).select().single()
    setIsUpdatingModule(false)
    if (modErr) {
      toast.error('Gagal membuat bab baru')
    } else {
      toast.success('Bab baru berhasil ditambahkan')
      onModuleAdded(modData)
      setSelectedModuleId(modData.id)
      setNewModuleTitle('')
    }
  }

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
      } else { contentUrl = isLink ? linkUrl.trim() : (editMaterial?.content_url || null) }
      setUploadProgress(85)
      
      // Resolve Module
      let targetModuleId = selectedModuleId === 'new' ? null : selectedModuleId
      let newMod
      if (!targetModuleId) {
        if (!newModuleTitle.trim()) { toast.error("Bab / Modul baru tidak boleh kosong"); setUploading(false); return }
        targetModuleId = crypto.randomUUID()
        const { data: modData, error: modErr } = await supabase.from('modules').insert({
          id: targetModuleId, class_id: classId, title: newModuleTitle.trim(), order: existingModules.length, updated_at: new Date().toISOString()
        }).select().single()
        if (modErr) throw new Error(modErr.message)
        newMod = modData
      }

      if (editMaterial) {
        const { data: mat, error: matErr } = await supabase.from('materials').update({
          module_id: targetModuleId, title: title.trim(), type: currentTab.dbType,
          content_url: contentUrl, content_text: description.trim() || null, order: Number(order) || 0,
          updated_at: new Date().toISOString(),
        }).eq('id', editMaterial.id).select().single()
        if (matErr) throw new Error(matErr.message)
        setUploadProgress(100)
        toast.success('Materi berhasil diperbarui! 🎉')
        onSuccess(mat as MaterialItem, newMod, true)
        onClose()
      } else {
        const { data: mat, error: matErr } = await supabase.from('materials').insert({
          id: crypto.randomUUID(), module_id: targetModuleId, title: title.trim(), type: currentTab.dbType,
          content_url: contentUrl, content_text: description.trim() || null, order: Number(order) || 0,
          updated_at: new Date().toISOString(),
        }).select().single()
        if (matErr) throw new Error(matErr.message)

        // Notify students
        const { data: students } = await supabase.from('class_students').select('student_id').eq('class_id', classId)
        if (students && students.length > 0) {
          await supabase.from('notifications').insert(
            students.map(s => ({
              user_id: s.student_id,
              message: `Materi baru ditambahkan: ${mat.title}`,
              type: 'SYSTEM'
            }))
          )
        }

        setUploadProgress(100)
        toast.success('Materi berhasil diunggah! 🎉')
        onSuccess(mat as MaterialItem, newMod, false)
        onClose()
      }
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
            <h2 className="text-base font-bold text-slate-800">{editMaterial ? 'Edit Materi' : 'Tambah Materi'}</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 relative">
                <div className="flex items-center justify-between -mb-0.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Bab / Modul <span className="text-red-600">*</span></label>
                  {selectedModuleId !== 'new' && existingModules.length > 0 && !editingModuleId && (
                    <div className="flex shrink-0 gap-1">
                      <button type="button" title="Edit Nama Bab" onClick={() => { setEditingModuleId(selectedModuleId); setEditedModuleTitle(existingModules.find(m => m.id === selectedModuleId)?.title || '') }} className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-amber-100 hover:text-amber-600 transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button type="button" title="Hapus Bab" onClick={() => handleDeleteModule(selectedModuleId)} className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
                {editingModuleId ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={editedModuleTitle}
                      onChange={e => setEditedModuleTitle(e.target.value)}
                      disabled={isUpdatingModule}
                      className="flex-1 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                    />
                    <button type="button" onClick={handleSaveModuleEdit} disabled={isUpdatingModule || !editedModuleTitle.trim()} className="rounded-xl bg-amber-500 p-2.5 text-white hover:bg-amber-600 disabled:opacity-50"><CheckCircle className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setEditingModuleId(null)} disabled={isUpdatingModule} className="rounded-xl bg-slate-200 p-2.5 text-slate-600 hover:bg-slate-300 disabled:opacity-50"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <select 
                    value={selectedModuleId} 
                    onChange={e => setSelectedModuleId(e.target.value)}
                    disabled={isUpdatingModule}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30"
                  >
                    {existingModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    <option value="new">+ Tambah Bab / Modul Baru...</option>
                  </select>
                )}
                {selectedModuleId === 'new' && (
                  <div className="flex items-center gap-1.5">
                    <input 
                      value={newModuleTitle} 
                      onChange={e => setNewModuleTitle(e.target.value)} 
                      required={selectedModuleId === 'new'}
                      maxLength={120} 
                      placeholder="Ketik nama bab baru (Contoh: Bab 1)" 
                      className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-900 placeholder-blue-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30" 
                    />
                    <button type="button" onClick={handleSaveNewModule} disabled={isUpdatingModule || !newModuleTitle.trim()} className="rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-50"><CheckCircle className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Materi ke- (Urutan) <span className="text-red-600">*</span></label>
                <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} required min={0}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Judul Materi <span className="text-red-600">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} placeholder="Contoh: Pengertian Geografi"
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
                  : editMaterial && editMaterial.type !== 'LINK' && editMaterial.content_url ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600"><CheckCircle className="h-5 w-5" /></div>
                      <p className="text-xs font-semibold text-slate-700">File sudah terunggah</p>
                      <a href={editMaterial.content_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"><ExternalLink className="h-3 w-3" /> Lihat file saat ini</a>
                      <p className="mt-3 border-t border-slate-200 pt-3 text-[10px] text-slate-500">Klik / drag file baru ke sini untuk mengganti</p>
                    </div>
                  )
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
            <button type="submit" disabled={uploading || !title.trim() || (isLink ? !linkUrl.trim() : (!file && !editMaterial))}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />{editMaterial ? 'Menyimpan…' : 'Mengunggah…'}</> : <><UploadCloud className="h-4 w-4" />{editMaterial ? 'Simpan Perubahan' : 'Unggah Materi'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClassDetailClient({ cls, teacherId }: { cls: ClassData; teacherId: string }) {
  const { confirm } = useConfirm()
  const initialItems: CourseItem[] = cls.modules.flatMap(m => [
    ...m.materials.map(mat => ({ ...mat, itemType: 'material' as CourseItemType })),
    ...(m.quizzes || []).map(q => ({ ...q, itemType: 'quiz' as CourseItemType }))
  ]).sort((a, b) => a.order - b.order)

  const [items, setItems] = useState<CourseItem[]>(initialItems)
  const [moduleId, setModuleId] = useState<string | null>(cls.modules.length > 0 ? cls.modules[0].id : null)
  const [showModal, setShowModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<CourseItem | null>(null)
  const [showMapEditor, setShowMapEditor] = useState(false)
  const [viewingMap, setViewingMap] = useState<CourseItem | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<CourseItem | null>(null)
  const [initializingModule, setInitializingModule] = useState(false)
  const [activeTab, setActiveTab] = useState<PageTab>('materi')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  const toggleModule = (id: string) => setExpandedModules(p => ({ ...p, [id]: !p[id] }))

  async function ensureModuleExists(): Promise<string | null> {
    if (cls.modules.length > 0) return cls.modules[0].id
    setInitializingModule(true)
    const supabase = createClient()
    const newId = crypto.randomUUID()
    const { data, error } = await supabase.from('modules').insert({ id: newId, class_id: cls.id, title: 'Bab 1', order: 0, updated_at: new Date().toISOString() }).select('id, title').single()
    setInitializingModule(false)
    if (error || !data) { console.error('Module insertion error:', error); toast.error('Gagal inisialisasi modul'); return null }
    cls.modules.push({ id: data.id, class_id: cls.id, title: data.title, materials: [], quizzes: [] })
    return data.id
  }

  async function handleOpenModal() { await ensureModuleExists(); setShowModal(true) }
  async function handleOpenMapEditor() { const mid = await ensureModuleExists(); if (mid) setShowMapEditor(true) }
  function handleMaterialAdded(mat: MaterialItem, newMod?: any, isUpdate?: boolean) { 
    if (newMod) {
      cls.modules.push({ ...newMod, materials: [], quizzes: [] })
    }
    setItems(prev => {
      if (isUpdate) {
        return prev.map(item => item.id === mat.id ? {
          ...item,
          title: mat.title,
          module_id: mat.module_id,
          order: mat.order ?? item.order,
          content_text: mat.content_text,
          content_url: mat.content_url,
          type: mat.type,
        } : item).sort((a, b) => a.order - b.order)
      } else {
        const newItems = [...prev, { ...mat, itemType: 'material' as CourseItemType }]
        return newItems.sort((a, b) => a.order - b.order)
      }
    }) 
  }

  async function handleMove(id: string, type: CourseItemType, dir: 'up' | 'down') {
    const current = items.find(i => i.id === id)
    if (!current) return
    const modItems = items.filter(i => i.module_id === current.module_id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const idx = modItems.findIndex(i => i.id === id)
    if (idx === -1) return
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === modItems.length - 1) return

    const swap = modItems[dir === 'up' ? idx - 1 : idx + 1]

    // Swap orders visually
    const tempOrder = current.order ?? idx
    const updatedCurrent = { ...current, order: swap.order ?? (dir === 'up' ? idx - 1 : idx + 1) }
    const updatedSwap = { ...swap, order: tempOrder }

    setItems(prev => prev.map(item => {
      if (item.id === current.id) return updatedCurrent
      if (item.id === swap.id) return updatedSwap
      return item
    }))

    // Save to DB
    const supabase = createClient()
    const table1 = current.itemType === 'material' ? 'materials' : 'quizzes'
    const table2 = swap.itemType === 'material' ? 'materials' : 'quizzes'

    await Promise.all([
      supabase.from(table1).update({ order: updatedCurrent.order }).eq('id', current.id),
      supabase.from(table2).update({ order: updatedSwap.order }).eq('id', swap.id)
    ])
  }

  async function handleDelete(id: string, type: CourseItemType, storageUrl: string | null) {
    if (type === 'quiz') {
      toast.error('Gunakan halaman Manajemen Kuis untuk menghapus kuis.')
      return
    }
    
    const isConfirmed = await confirm({
      title: 'Hapus Materi',
      message: 'Hapus materi ini?',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    const supabase = createClient()
    if (storageUrl?.includes('supabase')) {
      const pathMatch = storageUrl.match(/class-materials\/(.+)$/)
      if (pathMatch) await supabase.storage.from('class-materials').remove([pathMatch[1]])
    }
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (!error) { setItems(prev => prev.filter(m => m.id !== id)); toast.success('Materi dihapus') }
    else toast.error('Gagal menghapus materi')
  }

  const TABS = [
    { key: 'siswa'  as PageTab, label: 'Siswa',  icon: Users },
    { key: 'materi' as PageTab, label: 'Materi Kelas', icon: BookOpen, count: items.length },
    { key: 'peringkat' as PageTab, label: 'Peringkat', icon: Trophy },
  ]

  const nextOrderMap = cls.modules.reduce((acc, mod) => {
    acc[mod.id] = items.filter(i => i.module_id === mod.id).length + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-full p-3 sm:p-5 lg:p-7">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={async () => { await ensureModuleExists(); setShowQuizModal(true) }} disabled={initializingModule} className="group flex items-center gap-5 p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-fuchsia-300 hover:shadow-xl hover:shadow-fuchsia-900/5 hover:-translate-y-1 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors duration-300">
                {initializingModule ? <Loader2 className="h-6 w-6 animate-spin" /> : <ClipboardList className="h-7 w-7" />}
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg group-hover:text-fuchsia-600 transition-colors">Buat Kuis</h3>
                <p className="text-sm text-slate-500 mt-1">Soal Pilihan Ganda & Peta</p>
              </div>
            </button>
            <button onClick={() => { setEditingMaterial(null); setShowModal(true) }} disabled={initializingModule} className="group flex items-center gap-5 p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
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

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-300 bg-blue-50">
                <BookOpen className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Belum ada materi atau kuis</p>
              <p className="mt-1.5 max-w-xs text-xs text-slate-600">Gunakan menu di atas untuk mulai menambahkan materi, atau assign kuis dari menu Kuis.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">📚 Daftar Materi & Kuis ({items.length})</h2>
              </div>
              <div className="space-y-4">
                {cls.modules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(mod => {
                  const modItems = items.filter(i => i.module_id === mod.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  const isExpanded = expandedModules[mod.id] ?? true
                  return (
                    <div key={mod.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
                      <button onClick={() => toggleModule(mod.id)} className="flex w-full items-center justify-between bg-slate-50 p-4 transition-colors hover:bg-slate-100 focus:outline-none">
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600 shadow-inner">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-slate-800">{mod.title}</h3>
                            <p className="mt-0.5 text-xs text-slate-500">{modItems.length} Item Tersedia</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full", isExpanded ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500")}>
                            {isExpanded ? 'Tutup' : 'Buka'}
                          </span>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 p-4">
                          {modItems.length > 0 ? (
                            modItems.map((item, idx) => (
                              <CourseItemCard 
                                key={item.itemType + item.id} 
                                item={item} 
                                index={idx}
                                total={modItems.length}
                                onMove={handleMove}
                                onDelete={handleDelete} 
                                onViewMap={setViewingMap}
                                onEditQuiz={setEditingQuiz}
                                onEditMaterial={setEditingMaterial}
                              />
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                              <p className="text-sm font-medium text-slate-500">Belum ada materi atau kuis di bab ini.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'siswa' && (
        <ClassStudentsPanel classId={cls.id} />
      )}

      {activeTab === 'peringkat' && (
        <ClassLeaderboard classId={cls.id} />
      )}

      {/* Upload Modal */}
      {(showModal || editingMaterial) && (
        <UploadMaterialModal 
          classId={cls.id} 
          existingModules={cls.modules.map(m => ({ id: m.id, title: m.title }))} 
          nextOrderMap={nextOrderMap}
          editMaterial={editingMaterial}
          onClose={() => { setShowModal(false); setEditingMaterial(null); }} 
          onSuccess={handleMaterialAdded} 
          onModuleAdded={(mod) => {
            cls.modules.push({ ...mod, materials: [], quizzes: [] })
            setItems([...items]) // trigger re-render
          }}
        />
      )}

      {/* Quiz Modal */}
      {(showQuizModal || editingQuiz) && (
        <QuizEditorModal 
          classId={cls.id}
          existingModules={cls.modules.map(m => ({ id: m.id, title: m.title }))} 
          nextOrderMap={nextOrderMap}
          quiz={editingQuiz ? {
            id: editingQuiz.id,
            title: editingQuiz.title,
            class_id: cls.id,
            module_id: editingQuiz.module_id,
            time_limit: editingQuiz.time_limit ?? null,
            xp_reward: editingQuiz.xp_reward ?? 100,
            is_published: editingQuiz.is_published ?? false
          } : null}
          onClose={() => { setShowQuizModal(false); setEditingQuiz(null); }}
          onSaved={(newMod: any) => {
            setShowQuizModal(false)
            setEditingQuiz(null)
            // Reload the page to refresh items
            window.location.reload()
          }}
        />
      )}

      {/* Map Editor Modal */}
      {showMapEditor && moduleId && (
        <InteractiveMapEditorModal 
          existingModules={cls.modules.map(m => ({ id: m.id, title: m.title }))}
          defaultModuleId={moduleId}
          nextOrderMap={nextOrderMap}
          defaultTitle={`Peta Interaktif: ${cls.name}`}
          onClose={() => setShowMapEditor(false)} 
          onSuccess={handleMaterialAdded} 
        />
      )}

      {/* Map Viewer */}
      {viewingMap && (
        <InteractiveMapViewer
          title={viewingMap.title}
          dataString={viewingMap.content_text ?? null}
          onClose={() => setViewingMap(null)}
        />
      )}
    </div>
  )
}
