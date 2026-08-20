'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Video, Presentation, Link as LinkIcon, FileImage, Trash2, Plus, RefreshCw, ClipboardList, Eye, UploadCloud, X } from 'lucide-react'
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
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL')
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
      cancelText: 'Batal'
    })
    
    if (!isConfirmed) return

    if (url?.includes('supabase')) {
      const filePath = url.split('/').slice(-1)[0]
      await supabase.storage.from('materials').remove([filePath])
    }

    const { error } = await supabase.from('teacher_resources').delete().eq('id', id)
    if (!error) {
      toast.success('Materi dihapus dari Bank')
      setResources(prev => prev.filter(r => r.id !== id))
    } else {
      toast.error('Gagal menghapus materi')
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

  const extractChapter = (r: TeacherResource) => {
    if (!r.content) return 'Tanpa Kategori'
    let parsed = r.content
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed) } catch (e) { return 'Tanpa Kategori' }
    }
    return parsed?.chapter || 'Tanpa Kategori'
  }

  const chapters = Array.from(new Set(resources.map(r => extractChapter(r))))
  
  const groupedResources = chapters.reduce((acc, chap) => {
    acc[chap] = resources.filter(r => extractChapter(r) === chap)
    return acc
  }, {} as Record<string, TeacherResource[]>)

  const filteredResources = selectedChapter === 'ALL' 
    ? resources 
    : groupedResources[selectedChapter] || []

  return (
    <div className="min-h-full p-4 lg:p-6 relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            Bank Materi 
            <span className="flex h-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700">
              {resources.length}
            </span>
          </h1>
          <p className="text-sm text-slate-500">Kelola dan gunakan kembali file / materi yang pernah Anda unggah</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/40"
        >
          <Plus className="h-5 w-5" /> Unggah Baru
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row">
          
          <div className="w-full md:w-72 bg-slate-900 flex-shrink-0">
            <div className="p-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Kategori Materi</h2>
              
              <button 
                onClick={() => setSelectedChapter('ALL')} 
                className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all", 
                  selectedChapter === 'ALL' 
                    ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20" 
                    : "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <span>Semua Materi</span>
                <span className={cn("text-[11px] px-2.5 py-1 rounded-full font-black", 
                  selectedChapter === 'ALL' ? "bg-slate-900/10 text-slate-900" : "bg-slate-800 text-slate-400"
                )}>
                  {resources.length}
                </span>
              </button>
              
              <div className="my-2 border-t border-slate-700/50 mx-2" />

              {chapters.map(chap => (
                <button 
                  key={chap} 
                  onClick={() => setSelectedChapter(chap)} 
                  className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all", 
                    selectedChapter === chap 
                      ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20" 
                      : "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <span className="truncate pr-3">{chap}</span>
                  <span className={cn("text-[11px] px-2.5 py-1 rounded-full font-black", 
                    selectedChapter === chap ? "bg-slate-900/10 text-slate-900" : "bg-slate-800 text-slate-400"
                  )}>
                    {groupedResources[chap].length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[500px] p-6 lg:p-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredResources.map((item: TeacherResource) => {
                const meta = getIconAndColor(item.type, item.file_url)
                const Icon = meta.icon

                return (
                  <div key={item.id} className="group relative flex flex-col rounded-3xl border border-slate-200/80 bg-slate-50/30 p-5 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 hover:border-blue-300/50">
                    
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 transition-all">
                      {item.file_url && (
                        <button onClick={() => setViewingFile({ url: item.file_url!, title: item.title })} className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors text-xs font-bold shadow-sm" title="Buka File">
                          <Eye className="h-4 w-4" /> Lihat
                        </button>
                      )}
                      <button onClick={() => handleDelete(item.id, item.file_url)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-sm" title="Hapus Materi">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-start gap-4 mb-4 pr-20">
                      <div className={cn('flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm transition-transform group-hover:scale-105', meta.border)}>
                        <Icon className={cn('h-6 w-6', meta.color)} />
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                        <p className="text-[11px] font-semibold text-slate-400 mt-1">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between">
                      <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider', meta.bg, meta.color)}>
                        {meta.label}
                      </span>
                      
                      <p className="text-[11px] font-medium text-slate-500 italic truncate max-w-[60%] text-right">
                        {item.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <UploadBankResourceModal 
          teacherId={teacherId} 
          existingChapters={chapters.filter(c => c !== 'Tanpa Kategori')}
          onClose={() => setShowUploadModal(false)} 
          onSuccess={fetchResources} 
        />
      )}

      {viewingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg truncate pr-4">{viewingFile.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={viewingFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Buka di Tab Baru
                </a>
                <button 
                  onClick={() => setViewingFile(null)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center">
              {(() => {
                const url = viewingFile.url;
                const ext = url.split('.').pop()?.toLowerCase() || '';
                
                if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
                  return <img src={url} alt={viewingFile.title} className="max-w-full max-h-full rounded-xl object-contain shadow-sm" />;
                }
                if (['mp4', 'webm', 'ogg'].includes(ext)) {
                  return <video src={url} controls className="max-w-full max-h-full rounded-xl shadow-sm" />;
                }
                if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
                  const gviewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
                  return (
                    <div className="w-full h-full flex flex-col">
                      <div className="bg-amber-50 text-amber-800 text-xs p-2 text-center rounded-t-xl border border-amber-200">
                        Pratinjau dokumen Office. Jika gagal memuat, silakan klik <b>Buka di Tab Baru</b>.
                      </div>
                      <iframe src={gviewUrl} className="w-full flex-1 rounded-b-xl border-0 shadow-inner bg-white" title={viewingFile.title} />
                    </div>
                  );
                }
                
                // Fallback / Native PDF
                return <iframe src={url} className="w-full h-full rounded-2xl border-0 shadow-inner bg-white" title={viewingFile.title} />;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
