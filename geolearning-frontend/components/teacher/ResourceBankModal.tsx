'use client'

import { useState, useEffect } from 'react'
import { X, Search, FileText, Video, Presentation, Link as LinkIcon, FileImage, CheckCircle2, Loader2, Eye, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface TeacherResource {
  id: string
  title: string
  type: string
  file_url: string | null
  description: string | null
  created_at: string
}

interface ResourceBankModalProps {
  classId: string
  targetModuleId: string
  existingModules: { id: string; title: string }[]
  nextOrderMap?: Record<string, number>
  onClose: () => void
  onSuccess: () => void
}

export function ResourceBankModal({ classId, targetModuleId: initialModuleId, existingModules, nextOrderMap = {}, onClose, onSuccess }: ResourceBankModalProps) {
  const [resources, setResources] = useState<TeacherResource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { confirm } = useConfirm()
  
  const [targetModuleId, setTargetModuleId] = useState(initialModuleId)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [resourceOrder, setResourceOrder] = useState<number>(nextOrderMap[initialModuleId] || 0)

  useEffect(() => {
    if (targetModuleId !== 'new') {
      setResourceOrder(nextOrderMap[targetModuleId] || 0)
    } else {
      setResourceOrder(0)
    }
  }, [targetModuleId, nextOrderMap])

  const supabase = createClient()

  useEffect(() => {
    fetchBankResources()
  }, [])

  const fetchBankResources = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('teacher_resources')
      .select('id, title, type, file_url, description, created_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Gagal memuat bank materi')
    } else {
      setResources(data || [])
    }
    setLoading(false)
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return
    if (targetModuleId === 'new' && !newModuleTitle.trim()) {
      toast.error('Masukkan judul bab baru!')
      return
    }

    const isConfirmed = await confirm({
      title: 'Konfirmasi Penambahan',
      message: `Apakah Anda yakin ingin menambahkan ${selectedIds.length} materi yang dipilih ke kelas ini?`,
      confirmText: 'Ya, Tambahkan',
      cancelText: 'Batal'
    })

    if (!isConfirmed) return

    setIsSubmitting(true)
    const tid = toast.loading('Menambahkan materi ke kelas...')

    try {
      let finalModuleId = targetModuleId

      // Create new module if requested
      if (targetModuleId === 'new') {
        const { data: newMod, error: modErr } = await supabase
          .from('modules')
          .insert({
            class_id: classId,
            title: newModuleTitle.trim(),
            order: existingModules.length
          })
          .select()
          .single()

        if (modErr) throw new Error(modErr.message)
        finalModuleId = newMod.id
      }

      // Clone resources as material
      const selectedResources = resources.filter(r => selectedIds.includes(r.id))
      
      const insertPayloads = selectedResources.map((resource, idx) => ({
        module_id: finalModuleId,
        title: resource.title,
        type: resource.type,
        content_url: resource.file_url,
        content_text: resource.description,
        order: resourceOrder + idx,
        is_published: false,
        updated_at: new Date().toISOString()
      }))

      const { error: cloneErr } = await supabase
        .from('materials')
        .insert(insertPayloads)

      if (cloneErr) throw new Error(cloneErr.message)

      toast.success(`Berhasil menambahkan ${selectedIds.length} materi!`, { id: tid })
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan materi', { id: tid })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIconAndColor = (type: string, url: string | null) => {
    if (type === 'VIDEO') return { icon: Video, color: 'text-rose-500', bg: 'bg-rose-50' }
    if (type === 'LINK') return { icon: LinkIcon, color: 'text-indigo-500', bg: 'bg-indigo-50' }
    
    if (url) {
      if (url.endsWith('.pdf')) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' }
      if (url.match(/\.(ppt|pptx)$/)) return { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50' }
      if (url.match(/\.(png|jpg|jpeg|gif)$/i)) return { icon: FileImage, color: 'text-emerald-500', bg: 'bg-emerald-50' }
    }
    return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' }
  }

  const filteredResources = resources.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchSearch) return false
    
    if (filterType === 'ALL') return true
    if (filterType === 'PDF') return r.file_url?.endsWith('.pdf') || r.type === 'PDF' && !r.file_url?.match(/\.(ppt|pptx|doc|docx)$/i)
    if (filterType === 'VIDEO') return r.type === 'VIDEO'
    if (filterType === 'LINK') return r.type === 'LINK'
    return true
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-slate-50 shadow-2xl animate-in zoom-in-95 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Ambil dari Bank Materi</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Pilih satu atau beberapa materi untuk dimasukkan ke kelas ini
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Target Module Configuration */}
        <div className="border-b border-slate-200 bg-slate-100/50 px-8 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tujuan Bab (Module)
              </label>
              <select
                value={targetModuleId}
                onChange={(e) => setTargetModuleId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                {existingModules.map((mod) => (
                  <option key={mod.id} value={mod.id}>{mod.title}</option>
                ))}
                <option value="new">+ Buat Bab Baru</option>
              </select>
            </div>
            {targetModuleId === 'new' && (
              <div className="flex-1">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Judul Bab Baru
                </label>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Misal: Bab 1: Pengantar Geografi"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            )}
            <div className="w-32">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Mulai Urutan
              </label>
              <input
                type="number"
                value={resourceOrder}
                onChange={(e) => setResourceOrder(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 pb-20">
          
          <div className="border-b border-slate-200 bg-white px-8 py-4 flex-shrink-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari judul materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                {['ALL', 'PDF', 'VIDEO', 'LINK'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterType(status)}
                    className={cn(
                      "rounded-xl px-5 py-2 text-sm font-bold transition-all",
                      filterType === status
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {status === 'ALL' ? 'Semua' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <p className="mt-4 text-sm font-medium text-slate-500">Memuat materi...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200/50 text-slate-400">
                  <Search className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Tidak ada materi ditemukan</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-sm">
                  Coba gunakan kata kunci pencarian yang lain atau unggah materi baru di menu Bank Materi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredResources.map((item) => {
                  const meta = getIconAndColor(item.type, item.file_url)
                  const Icon = meta.icon
                  const isSelected = selectedIds.includes(item.id)

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelection(item.id)}
                      className={cn(
                        "group relative flex cursor-pointer flex-col rounded-3xl border bg-white p-5 transition-all duration-300 select-none",
                        isSelected ? "border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500 bg-blue-50/10" : "border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1"
                      )}
                    >
                      <div className="absolute right-4 top-4">
                        <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border transition-colors", isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 bg-slate-50 text-transparent")}>
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="flex items-start gap-4 mb-4 pr-8">
                        <div className={cn('flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm border border-slate-100 transition-transform group-hover:scale-105', isSelected ? "bg-white" : meta.bg)}>
                          <Icon className={cn('h-7 w-7', meta.color)} />
                        </div>
                        <div className="flex-1 pt-1">
                          <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                          <p className="text-[11px] font-semibold text-slate-400 mt-1">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-8 py-5 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-600">
            {selectedIds.length} materi dipilih
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Menambahkan...</> : <><CheckCircle2 className="h-5 w-5" /> Tambahkan {selectedIds.length} Materi</>}
          </button>
        </div>

      </div>
    </div>
  )
}
