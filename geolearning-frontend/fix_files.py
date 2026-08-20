import codecs

with codecs.open('d:/SEMESTER 8/geo_LearningMedia/geolearning-frontend/components/teacher/UploadBankResourceModal.tsx', 'w', encoding='utf-8') as f:
    f.write(''''use client'

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
    const ext = .
    if (!currentTab.accept.includes(ext)) { toast.error(Format tidak didukung untuk tipe ); return }
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
        const ext = file.name.split('.').pop()
        const path = ank-materials/_.
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
''')

with codecs.open('d:/SEMESTER 8/geo_LearningMedia/geolearning-frontend/components/teacher/ResourceBankClient.tsx', 'w', encoding='utf-8') as f:
    f.write(''''use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Video, Presentation, Link as LinkIcon, FileImage, Trash2, Plus, Eye, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { UploadBankResourceModal } from './UploadBankResourceModal'

interface TeacherResource {
  id: string
  teacher_id: string
  title: string
  description: string | null
  type: string
  file_url: string | null
  content: any | null
  created_at: string
}

export function ResourceBankClient({ teacherId }: { teacherId: string }) {
  const [resources, setResources] = useState<TeacherResource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  
  const { confirm } = useConfirm()
  const supabase = createClient()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewingFile, setViewingFile] = useState<{ url: string, title: string } | null>(null)

  const fetchResources = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('teacher_resources')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Gagal memuat Bank Materi')
    } else {
      setResources(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
  }, [])

  const handleDelete = async (id: string, url: string | null) => {
    const isConfirmed = await confirm({
      title: 'Hapus Materi?',
      message: 'Materi ini akan dihapus permanen dari Bank Materi.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'danger'
    })
    
    if (!isConfirmed) return

    const tid = toast.loading('Menghapus...')
    if (url?.includes('supabase')) {
      const filePath = url.split('/').slice(-1)[0]
      await supabase.storage.from('materials').remove([filePath])
    }

    const { error } = await supabase.from('teacher_resources').delete().eq('id', id)
    if (!error) {
      toast.success('Materi dihapus dari Bank', { id: tid })
      setResources(prev => prev.filter(r => r.id !== id))
    } else {
      toast.error('Gagal menghapus materi', { id: tid })
    }
  }

  const getIconAndColor = (type: string, url: string | null) => {
    if (type === 'VIDEO') return { icon: Video, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Video' }
    if (type === 'LINK') return { icon: LinkIcon, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Link' }
    
    if (url) {
      if (url.endsWith('.pdf')) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'PDF' }
      if (url.match(/\.(ppt|pptx)$/)) return { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'PPT' }
      if (url.match(/\.(png|jpg|jpeg|gif)$/i)) return { icon: FileImage, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Gambar' }
    }
    return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Dokumen' }
  }

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    if (filterType === 'ALL') return true
    if (filterType === 'PDF') return r.file_url?.endsWith('.pdf') || r.type === 'PDF' && !r.file_url?.match(/\.(ppt|pptx|doc|docx)$/i)
    if (filterType === 'VIDEO') return r.type === 'VIDEO'
    if (filterType === 'LINK') return r.type === 'LINK'
    if (filterType === 'PPT') return r.file_url?.match(/\.(ppt|pptx)$/i)
    if (filterType === 'DOC') return r.file_url?.match(/\.(doc|docx)$/i)
    
    return true
  })

  return (
    <div className="min-h-full p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bank Materi</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Kelola dan gunakan kembali materi yang pernah Anda unggah ke semua kelas.
          </p>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          Unggah Materi Baru
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
          {['ALL', 'PDF', 'VIDEO', 'LINK', 'PPT', 'DOC'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                filterType === type
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {type === 'ALL' ? 'Semua' : type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Memuat bank materi...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 px-4 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Tidak ada materi ditemukan</h3>
          <p className="mt-2 text-sm text-slate-500">
            {searchQuery || filterType !== 'ALL'
              ? 'Coba gunakan kata kunci atau filter lain.'
              : 'Anda belum memiliki materi di Bank. Klik "Unggah Materi Baru" untuk memulai.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((item: TeacherResource) => {
            const meta = getIconAndColor(item.type, item.file_url)
            const Icon = meta.icon

            return (
              <div key={item.id} className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-300">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  {item.file_url && (
                    <button onClick={() => setViewingFile({ url: item.file_url!, title: item.title })} className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm" title="Lihat Materi">
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(item.id, item.file_url)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-sm" title="Hapus Materi">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm transition-transform group-hover:scale-105', meta.border)}>
                    <Icon className={cn('h-6 w-6', meta.color)} />
                  </div>
                  <div className="flex-1 pt-0.5 pr-12">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1.5">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className={cn('rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', meta.bg, meta.color)}>
                    {meta.label}
                  </span>
                  
                  {item.description && (
                    <p className="text-[11px] font-medium text-slate-500 italic truncate max-w-[60%] text-right">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUploadModal && (
        <UploadBankResourceModal 
          teacherId={teacherId} 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={fetchResources} 
        />
      )}

      {viewingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-5xl h-[85vh] bg-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg truncate pr-4">{viewingFile.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={viewingFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Buka di Tab Baru
                </a>
                <button 
                  onClick={() => setViewingFile(null)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
              {(() => {
                const url = viewingFile.url;
                const ext = url.split('.').pop()?.toLowerCase() || '';
                
                if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
                  return <img src={url} alt={viewingFile.title} className="max-w-full max-h-full rounded-2xl object-contain shadow-sm bg-white" />;
                }
                if (['mp4', 'webm', 'ogg'].includes(ext)) {
                  return <video src={url} controls className="max-w-full max-h-full rounded-2xl shadow-sm bg-black" />;
                }
                if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
                  const gviewUrl = https://docs.google.com/gview?url= + encodeURIComponent(url) + &embedded=true;
                  return (
                    <div className="w-full h-full flex flex-col shadow-sm rounded-2xl overflow-hidden bg-white">
                      <div className="bg-amber-50 text-amber-800 text-xs p-2 text-center border-b border-amber-200">
                        Pratinjau dokumen Office. Jika gagal memuat, silakan klik <b>Buka di Tab Baru</b>.
                      </div>
                      <iframe src={gviewUrl} className="w-full flex-1 border-0" title={viewingFile.title} />
                    </div>
                  );
                }
                return <iframe src={url} className="w-full h-full rounded-2xl border-0 shadow-sm bg-white" title={viewingFile.title} />;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
''')
