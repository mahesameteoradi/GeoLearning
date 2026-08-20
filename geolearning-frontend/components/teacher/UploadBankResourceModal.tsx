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

export function UploadBankResourceModal({ teacherId, onClose, onSuccess }: { teacherId: string; onClose: () => void; onSuccess: () => void }) {
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

  function handleFile(f: File) {
    if (f.size > 500 * 1024 * 1024) { toast.error('Ukuran maksimal file adalah 500MB'); return }
    const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '')
    if (!currentTab.accept.includes(ext)) { toast.error('Format tidak didukung untuk tipe ' + currentTab.label); return }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (isLink && !linkUrl.trim()) return
    if (!isLink && !file) return

    setUploading(true)
    const tid = toast.loading('Mengunggah materi...')
    try {
      const supabase = createClient()
      let finalUrl = linkUrl.trim()
      let finalType = currentTab.dbType

      if (!isLink && file) {
        const ext = file.name.split('.').pop() || ''
        const path = 'bank-materials/' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext
        setUploadProgress(20)
        const { error: uploadErr } = await supabase.storage.from('materials').upload(path, file, { 
          cacheControl: '3600', upsert: false 
        })
        if (uploadErr) throw new Error(uploadErr.message)
        const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
        finalUrl = publicUrl
        setUploadProgress(70)
      }

      const { error: saveErr } = await supabase.from('teacher_resources').insert({
        teacher_id: teacherId,
        title: title.trim(),
        description: description.trim() || null,
        type: finalType,
        file_url: finalUrl,
        content: null
      })

      if (saveErr) throw new Error(saveErr.message)

      toast.success('Materi berhasil diunggah!', { id: tid })
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah', { id: tid })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Unggah ke Bank Materi</h2>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>

          <div className="mb-5 grid grid-cols-5 gap-1.5">
            {UPLOAD_TABS.map((t) => {
              const Icon = t.icon
              return (
                <button key={t.key} type="button" onClick={() => { setTab(t.key); setFile(null) }}
                  className={cn('flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[10px] font-semibold transition-all',
                    tab === t.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                  <Icon className="h-5 w-5" />
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-4 mb-6">
            {!isLink ? (
              <div 
                className={cn("group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all", dragOver ? "border-blue-500 bg-blue-50" : file ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50")}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]) }}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept={currentTab.accept} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[250px]">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / (1024*1024)).toFixed(1)} MB</p>
                    <button type="button" onClick={() => setFile(null)} className="mt-3 text-[11px] font-bold text-rose-500 hover:underline">Ganti File</button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                    <p className="text-sm font-semibold text-slate-700">Drag & drop atau klik untuk pilih file</p>
                    <p className="text-[11px] text-slate-500 mt-1">{currentTab.accept.replace(/\./g, '').toUpperCase()} • Maks. 500MB</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">Pilih File</button>
                  </>
                )}
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">URL Tautan / Link <span className="text-rose-500">*</span></label>
                <input type="url" required value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Judul Materi <span className="text-rose-500">*</span></label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Misal: Materi Bab 1"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Catatan / Deskripsi (Opsional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Penjelasan singkat tentang materi ini..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={uploading} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={uploading || !title.trim() || (isLink ? !linkUrl.trim() : !file)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Mengunggah...</> : <><UploadCloud className="h-4 w-4" />Simpan ke Bank</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
