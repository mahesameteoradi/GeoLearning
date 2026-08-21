'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export function EditResourceBankModal({ 
  item, 
  onClose, 
  onSuccess 
}: { 
  item: any; 
  onClose: () => void; 
  onSuccess: () => void 
}) {
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description || '')
  const [xpReward, setXpReward] = useState<number>(item.xp_reward ?? 15)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    const tid = toast.loading('Menyimpan perubahan...')
    try {
      const supabase = createClient()
      
      const { error } = await supabase.from('teacher_resources').update({
        title: title.trim(),
        description: description.trim() || null,
        xp_reward: xpReward,
        updated_at: new Date().toISOString()
      }).eq('id', item.id)

      if (error) throw new Error(error.message)

      toast.success('Perubahan berhasil disimpan!', { id: tid })
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan perubahan', { id: tid })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-md">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Edit Materi Bank</h2>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Judul Materi <span className="text-rose-500">*</span></label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Misal: Materi Bab 1"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Catatan / Deskripsi (Opsional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Penjelasan singkat tentang materi ini..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Poin XP <span className="text-rose-500">*</span></label>
              <input type="number" min={0} required value={xpReward} onChange={e => setXpReward(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={saving || !title.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</> : <><Save className="h-4 w-4" />Simpan Perubahan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
