'use client'

import { useState, useRef } from 'react'
import {
  X, Plus, FileText, Video, Presentation, Link as LinkIcon,
  UploadCloud, CheckCircle, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'

type UploadTab = 'pdf' | 'video' | 'ppt' | 'doc' | 'link'
const UPLOAD_TABS: { key: UploadTab; label: string; icon: React.ElementType; accept: string; dbType: string }[] = [
  { key: 'pdf',   label: 'PDF',        icon: FileText,     accept: '.pdf',                 dbType: 'PDF'   },
  { key: 'video', label: 'Video',      icon: Video,        accept: '.mp4,.webm,.mov,.avi', dbType: 'VIDEO' },
  { key: 'ppt',   label: 'Presentasi', icon: Presentation, accept: '.ppt,.pptx',           dbType: 'PDF'   },
  { key: 'doc',   label: 'Dokumen',    icon: FileText,     accept: '.doc,.docx',           dbType: 'PDF'   },
  { key: 'link',  label: 'Link',       icon: LinkIcon,     accept: '',                     dbType: 'LINK'  },
]

export function UploadBankResourceModal({ teacherId, existingChapters, onClose, onSuccess }: { teacherId: string; existingChapters: string[]; onClose: () => void; onSuccess: () => void }) {
  const [tab, setTab] = useState<UploadTab>('pdf')
  const [title, setTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(existingChapters.length > 0 ? existingChapters[0] : 'new')
  const [newCategory, setNewCategory] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const currentTab = UPLOAD_TABS.find(t => t.key === tab)!
  const isLink = tab === 'link'

  function handleFile(f: File) {
    if (f.size > 500 * 1024 * 1024) { toast.error('Ukuran maksimal file adalah 500MB'); return }
    const ext = `.${f.name.split('.').pop()?.toLowerCase()}`
    if (!currentTab.accept.includes(ext)) { toast.error(`Format tidak didukung untuk tipe ${currentTab.label}`); return }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalCategory = selectedCategory === 'new' ? newCategory.trim() : selectedCategory
    if (!title.trim() || !finalCategory) return
    if (isLink && !linkUrl.trim()) return
    if (!isLink && !file) return

    setUploading(true)
    setUploadProgress(0)
    const supabase = createClient()
    let contentUrl: string | null = null

    try {
      if (!isLink && file) {
        const ext = file.name.split('.').pop()
        const path = `bank/${teacherId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
        setUploadProgress(30)
        const { error: uploadErr } = await supabase.storage.from('class-materials').upload(path, file, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: file.type 
        })
        if (uploadErr) throw new Error(uploadErr.message)
        setUploadProgress(70)
        const { data: { publicUrl } } = supabase.storage.from('class-materials').getPublicUrl(path)
        contentUrl = publicUrl
      } else {
        contentUrl = linkUrl.trim()
      }

      setUploadProgress(90)
      
      const { error: saveErr } = await supabase.from('teacher_resources').insert({
        id: crypto.randomUUID(),
        teacher_id: teacherId,
        title: title.trim(),
        type: currentTab.dbType,
        description: description.trim() || null,
        file_url: contentUrl,
        content: { chapter: finalCategory },
        updated_at: new Date().toISOString(),
      })

      if (saveErr) throw new Error(saveErr.message)

      setUploadProgress(100)
      toast.success('Materi berhasil diarsipkan! 🎉')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/60">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
              <Plus className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Arsipkan File Baru</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-5 gap-1.5">
          {UPLOAD_TABS.map((t) => {
            const Icon = t.icon
            const isSelected = tab === t.key
            return (
              <button key={t.key} type="button" onClick={() => { setTab(t.key); setFile(null) }}
                className={cn('flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[10px] font-semibold transition-all',
                  isSelected ? `bg-blue-50 border-blue-200 text-blue-600` : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-500')}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Judul Materi <span className="text-red-600">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} placeholder="Contoh: Pengertian Geografi"
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Kategori / Bab <span className="text-red-600">*</span></label>
              {selectedCategory === 'new' ? (
                <div className="flex gap-2">
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)} required maxLength={50} placeholder="Bab baru..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30" />
                  {existingChapters.length > 0 && (
                    <button type="button" onClick={() => setSelectedCategory(existingChapters[0])} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30 appearance-none">
                  {existingChapters.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="new">+ Tambah Kategori Baru</option>
                </select>
              )}
            </div>
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
                  : (<><UploadCloud className="h-7 w-7 text-slate-600" /><p className="text-xs font-semibold text-slate-500">Drag &amp; drop atau klik untuk pilih file</p><p className="text-[11px] text-slate-600">{currentTab.accept.replace(/\./g, '').toUpperCase()} · Maks. 500MB</p></>)}
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
            <button type="submit" disabled={uploading || !title.trim() || (selectedCategory === 'new' && !newCategory.trim()) || (isLink ? !linkUrl.trim() : !file)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan…</> : <><UploadCloud className="h-4 w-4" />Simpan File</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
