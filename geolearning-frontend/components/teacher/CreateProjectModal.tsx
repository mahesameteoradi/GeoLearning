'use client'

import { useState } from 'react'
import { X, Loader2, BookMarked } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'

interface ClassOption {
  id: string
  name: string
}

interface CreateProjectModalProps {
  classes: ClassOption[]
  onClose: () => void
  onSaved: () => void
}

export function CreateProjectModal({ classes, onClose, onSaved }: CreateProjectModalProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    class_id: classes[0]?.id ?? '',
    xp_reward: 100,
    deadline: '',
    is_published: true,
    is_group_project: false,
  })

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
      const { error } = await supabase.from('project_assignments').insert({
        id: crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description.trim(),
        class_id: form.class_id,
        xp_reward: form.xp_reward,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        is_published: form.is_published,
        is_group_project: form.is_group_project,
        updated_at: new Date().toISOString(),
      }).select().single()
      if (error) throw error

      // Notify students
      if (form.is_published) {
        const { data: students } = await supabase.from('class_students').select('student_id').eq('class_id', form.class_id)
        if (students && students.length > 0) {
          await supabase.from('notifications').insert(
            students.map(s => ({
              user_id: s.student_id,
              message: `Tugas Proyek baru ditambahkan: ${form.title.trim()}`,
              type: 'SYSTEM'
            }))
          )
        }
      }

      toast.success('Tugas Proyek berhasil dibuat! 🎉')
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
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
              <BookMarked className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Buat Tugas Proyek
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
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
                <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_group_project ? 'bg-violet-500' : 'bg-slate-200')}>
                  <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_group_project ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <input type="checkbox" className="sr-only" checked={form.is_group_project} onChange={e => setForm({ ...form, is_group_project: e.target.checked })} />
                <span className="text-sm font-semibold text-slate-700">{form.is_group_project ? 'Tugas Kelompok' : 'Individu'}</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase">Status</label>
              <label className="flex mt-2 cursor-pointer items-center gap-3">
                <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_published ? 'bg-emerald-500' : 'bg-slate-200')}>
                  <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_published ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <input type="checkbox" className="sr-only" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                <span className="text-sm font-semibold text-slate-700">{form.is_published ? 'Published' : 'Draft'}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '💾 Simpan Tugas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
