'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Video, Presentation, Link as LinkIcon, FileImage, Trash2, Plus, Eye, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { UploadBankResourceModal } from './UploadBankResourceModal'
import { EditResourceBankModal } from './EditResourceBankModal'
import { Edit3 } from 'lucide-react'
import { AnimatedFilterTabs } from '@/components/ui/AnimatedFilterTabs'
import { motion, AnimatePresence } from 'framer-motion'

interface TeacherResource {
  id: string
  teacher_id: string
  title: string
  description: string | null
  type: string
  file_url: string | null
  content: any | null
  xp_reward?: number
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
  const [editingItem, setEditingItem] = useState<TeacherResource | null>(null)
  const [viewingFile, setViewingFile] = useState<{ url: string, title: string } | null>(null)

  const fetchResources = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('teacher_resources')
      .select('id, teacher_id, title, type, file_url, description, xp_reward, content, created_at')
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
    if (type === 'LINK') return { icon: LinkIcon, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Link' }
    
    if (url) {
      if (url.endsWith('.pdf')) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'PDF' }
      if (url.match(/\.(ppt|pptx)$/)) return { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'PPT' }
      if (url.match(/\.(png|jpg|jpeg|gif)$/i)) return { icon: FileImage, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Gambar' }
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bank Materi</h1>
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
        <AnimatedFilterTabs
          activeTab={filterType}
          onChange={(tab) => setFilterType(tab)}
          options={[
            { id: 'ALL', label: 'Semua' },
            { id: 'PDF', label: 'PDF' },
            { id: 'VIDEO', label: 'VIDEO' },
            { id: 'LINK', label: 'LINK' },
            { id: 'PPT', label: 'PPT' },
            { id: 'DOC', label: 'DOC' }
          ]}
          layoutId="resource-bank-filter"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Memuat bank materi...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 px-4 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
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
          <AnimatePresence mode="popLayout">
            {filteredResources.map((item: TeacherResource) => {
              const meta = getIconAndColor(item.type, item.file_url)
              const Icon = meta.icon

              return (
                <motion.div 
                  key={item.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:shadow-md hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-300"
                >
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  {item.file_url && (
                    <button onClick={() => setViewingFile({ url: item.file_url!, title: item.title })} className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm" title="Lihat Materi">
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setEditingItem(item)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-colors shadow-sm" title="Edit Materi">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id, item.file_url)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-sm" title="Hapus Materi">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm transition-transform group-hover:scale-105', meta.border)}>
                    <Icon className={cn('h-6 w-6', meta.color)} />
                  </div>
                  <div className="flex-1 pt-0.5 pr-12">
                    <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
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
              </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {showUploadModal && (
        <UploadBankResourceModal 
          teacherId={teacherId} 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={() => {
            fetchResources()
            setShowUploadModal(false)
          }} 
        />
      )}

      {editingItem && (
        <EditResourceBankModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null)
            fetchResources()
          }}
        />
      )}

      {/* Viewer Modal omitted here for brevity, keeping same viewer code */}
      {viewingFile && (
        <div className="fixed inset-0 z-[100] flex items-start overflow-y-auto justify-center p-4 py-8 bg-slate-800/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-5xl h-[85vh] bg-slate-50 rounded-2xl overflow-hidden shadow-md flex flex-col animate-in zoom-in-95">
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
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
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
                  const gviewUrl = 'https://docs.google.com/gview?url=' + encodeURIComponent(url) + '&embedded=true';
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
