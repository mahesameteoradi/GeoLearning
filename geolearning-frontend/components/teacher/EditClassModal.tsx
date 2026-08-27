'use client'

import { useState } from 'react'
import { X, Plus, BookMarked, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface EditClassModalProps {
  onClose: () => void
  classData: {
    id: string
    name: string
    description: string | null
    gamification_mode?: string
    grade_level?: number | null
  }
}

export function EditClassModal({ onClose, classData }: EditClassModalProps) {
  const [form, setForm] = useState({ 
    name: classData.name || '', 
    description: classData.description || '', 
    gamification_mode: classData.gamification_mode || 'STANDARD',
    grade_level: classData.grade_level ? classData.grade_level.toString() : ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('classes').update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        gamification_mode: form.gamification_mode,
        grade_level: form.grade_level ? parseInt(form.grade_level, 10) : null,
        updated_at: new Date().toISOString(),
      }).eq('id', classData.id)

      if (error) {
        // Supabase PostgrestError — use multiple methods to surface ALL properties
        // (console.error alone shows {} because properties may be non-enumerable)
        const errInfo = JSON.stringify(error, Object.getOwnPropertyNames(error as object))
        console.error('[CreateClass] Supabase error (full):', errInfo)
        console.error('[CreateClass] error.message:', (error as { message?: string }).message)
        console.error('[CreateClass] error.code:', (error as { code?: string }).code)
        console.error('[CreateClass] error.details:', (error as { details?: string }).details)
        console.error('[CreateClass] error.hint:', (error as { hint?: string }).hint)
        const msg = (error as { message?: string }).message ?? errInfo ?? 'RLS atau constraint violation'
        throw new Error(msg)
      }

      toast.success('Kelas berhasil diperbarui! 🎉')
      router.refresh()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[CreateClass] catch:', msg)
      toast.error(`Gagal mengedit kelas: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center p-4 py-8 md:py-12"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md animate-pop-in rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-black/60"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
              <BookMarked className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Edit Kelas</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Nama Kelas <span className="text-red-600">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={80}
              placeholder="Contoh: Geografi XII-A"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Deskripsi <span className="text-slate-600">(opsional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              maxLength={300}
              placeholder="Deskripsi singkat tentang kelas ini…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Tingkat Kelas <span className="text-slate-600">(opsional)</span>
            </label>
            <select
              value={form.grade_level}
              onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            >
              <option value="">-- Pilih Tingkat Kelas --</option>
              <option value="10">Kelas 10</option>
              <option value="11">Kelas 11</option>
              <option value="12">Kelas 12</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Membuat…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
