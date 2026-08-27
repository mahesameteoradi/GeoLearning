'use client'

import { useState } from 'react'
import { X, Loader2, Edit3, FlaskConical, Cpu, Wrench, Palette, Calculator, Upload, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'

interface ClassOption {
  id: string
  name: string
}

interface EditProjectModalProps {
  project: any
  classes: ClassOption[]
  onClose: () => void
  onSaved: () => void
}

export function EditProjectModal({ project, classes, onClose, onSaved }: EditProjectModalProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const initialSteam = project.steam_integration || {
    science: '', technology: '', engineering: '', art: '', mathematics: ''
  }
  const [form, setForm] = useState({
    title: project.title || '',
    description: project.description || '',
    instruction_file_url: project.instruction_file_url || '',
    class_id: project.class_id || (classes[0]?.id ?? ''),
    xp_reward: project.xp_reward || 100,
    deadline: project.deadline ? new Date(project.deadline).toISOString().slice(0, 16) : '',
    is_published: project.is_published ?? true,
    is_group_project: project.is_group_project ?? false,
    use_steam: !!project.steam_integration,
    steam: initialSteam
  })
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const path = `project-instructions/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('class-materials')
      .upload(path, file, { cacheControl: '31536000', upsert: false })

    if (uploadError) {
      toast.error(`Gagal mengunggah file: ${uploadError.message}`)
      setIsUploading(false)
      return
    }

    const { data } = supabase.storage.from('class-materials').getPublicUrl(path)
    setForm(prev => ({ ...prev, instruction_file_url: data.publicUrl }))
    setIsUploading(false)
    toast.success('File berhasil diunggah')
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Judul dan Deskripsi wajib diisi')
      return
    }
    if (!form.class_id) {
      toast.error('Pilih kelas terlebih dahulu')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('project_assignments')
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          class_id: form.class_id,
          xp_reward: form.xp_reward,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
          instruction_file_url: form.instruction_file_url || null,
          is_published: form.is_published,
          is_group_project: form.is_group_project,
          steam_integration: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)

      if (error) throw error

      toast.success('Tugas Proyek berhasil diperbarui! 🎉')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-12"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
              <Edit3 className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Edit Tugas Proyek
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Judul Tugas</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              placeholder="Contoh: Analisis Iklim Indonesia"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Deskripsi & Instruksi</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              placeholder="Masukkan instruksi tugas di sini..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">File Arahan / Panduan (PDF/Opsional)</label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? 'Mengunggah...' : 'Unggah File'}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
              {form.instruction_file_url && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">File terlampir</span>
                  <button onClick={() => setForm({ ...form, instruction_file_url: '' })} className="ml-2 text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Kelas</label>
              <select
                value={form.class_id}
                onChange={e => setForm({ ...form, class_id: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Maksimal XP Reward</label>
              <input
                type="number"
                value={form.xp_reward}
                onChange={e => setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Batas Waktu (Opsional)</label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Tipe Tugas</label>
              <label className="flex mt-2 cursor-pointer items-center gap-3">
                <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_group_project ? 'bg-amber-500' : 'bg-slate-200')}>
                  <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_group_project ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <input type="checkbox" className="sr-only" checked={form.is_group_project} onChange={e => setForm({ ...form, is_group_project: e.target.checked })} />
                <span className="text-sm font-semibold text-slate-700">{form.is_group_project ? 'Tugas Kelompok' : 'Individu'}</span>
              </label>
            </div>
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Status Publikasi</label>
              <label className="flex mt-2 cursor-pointer items-center gap-3">
                <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_published ? 'bg-green-500' : 'bg-slate-200')}>
                  <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_published ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <input type="checkbox" className="sr-only" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                <span className="text-sm font-semibold text-slate-700">{form.is_published ? 'Published' : 'Draft'}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '💾 Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
